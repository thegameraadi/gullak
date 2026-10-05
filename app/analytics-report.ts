import {database} from "./store";
import {env} from "cloudflare:workers";
import {trafficClasses} from "@/lib/traffic-classification";

export const analyticsDays = (value:unknown) => ["7","30","90"].includes(String(value)) ? Number(value) : 30;
export async function analyticsReport(days:number) {
  const now=new Date(),today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()),dayMs=86400000;
  const since=new Date(today-(days-1)*dayMs).toISOString(),previous=new Date(today-(2*days-1)*dayMs).toISOString(),until=now.toISOString();
  const db=database();
  const summary=(start:string,end:string)=>db.prepare(`SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions,
    COALESCE(SUM(name='page_view'),0) AS pageViews, COALESCE(SUM(name='gullie_message_sent'),0) AS messages,
    COALESCE(SUM(name='goal_created'),0) AS goalsCreated, COALESCE(SUM(name='app_error'),0) AS errors
    FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<?`).bind(start,end);
  const group=(column:"source"|"device"|"os"|"browser"|"mode"|"standalone")=>db.prepare(`SELECT ${column} AS label, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<? GROUP BY ${column} ORDER BY visitors DESC`).bind(since,until);
  const results=await db.batch([
    summary(since,until),summary(previous,since),
    db.prepare("SELECT substr(occurred_at,1,10) AS day,COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions,COALESCE(SUM(name='page_view'),0) AS pageViews FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<? GROUP BY day ORDER BY day").bind(since,until),
    group("source"),group("device"),group("os"),group("browser"),group("mode"),group("standalone"),
    db.prepare("SELECT name AS label,COUNT(*) AS events,COUNT(DISTINCT visitor_id) AS visitors FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<? GROUP BY name ORDER BY events DESC").bind(since,until),
    db.prepare("SELECT engine AS label,COUNT(*) AS events FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<? AND name='gullie_reply_received' GROUP BY engine ORDER BY events DESC").bind(since,until),
    db.prepare("SELECT COUNT(DISTINCT visitor_id) AS visitors FROM gullak_analytics_events WHERE occurred_at>=?").bind(new Date(now.getTime()-1800000).toISOString()),
    db.prepare("SELECT COUNT(*) AS accounts FROM gullak_accounts"),
    db.prepare("SELECT COUNT(*) AS goals FROM gullak_accounts,json_each(gullak_accounts.state_json,'$.goals') AS goal WHERE json_extract(goal.value,'$.draft')=0 AND json_extract(goal.value,'$.status')='active'"),
    db.prepare("SELECT COUNT(*) AS wins FROM gullak_accounts,json_each(gullak_accounts.state_json,'$.goals') AS goal WHERE json_extract(goal.value,'$.status')='purchased'"),
    db.prepare("SELECT COUNT(*) AS visitors FROM (SELECT e.visitor_id,v.first_seen,MAX(e.occurred_at) AS latest FROM gullak_analytics_events e JOIN gullak_analytics_visitors v ON v.id=e.visitor_id WHERE e.occurred_at>=? AND e.occurred_at<? GROUP BY e.visitor_id) WHERE substr(first_seen,1,10)<substr(latest,1,10)").bind(since,until),
    db.prepare("SELECT traffic_class AS label,COUNT(*) AS count FROM gullak_analytics_visits WHERE occurred_at>=? AND occurred_at<? GROUP BY traffic_class").bind(since,until),
    db.prepare("SELECT traffic_class AS label,COUNT(*) AS count FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<? AND name NOT IN ('page_view','visitor_engaged') GROUP BY traffic_class").bind(since,until),
    db.prepare("SELECT traffic_signal AS label,COUNT(*) AS count FROM gullak_analytics_visits WHERE occurred_at>=? AND occurred_at<? AND traffic_class='bot' GROUP BY traffic_signal").bind(since,until),
    db.prepare("SELECT traffic_signal AS label,COUNT(*) AS count FROM gullak_analytics_events WHERE occurred_at>=? AND occurred_at<? AND traffic_class='bot' AND name NOT IN ('page_view','visitor_engaged') GROUP BY traffic_signal").bind(since,until),
    db.prepare("SELECT MIN(occurred_at) AS first FROM gullak_analytics_visits"),
  ]);
  type Summary={visitors:number;sessions:number;pageViews:number;messages:number;goalsCreated:number;errors:number};
  type Group={label:string|number;visitors:number;sessions:number};
  type Feature={label:string;events:number;visitors:number};
  type Daily={day:string;visitors:number;sessions:number;pageViews:number};
  const recorded=results[2].results as Daily[];
  const value=(i:number,key:string)=>Number((results[i].results[0] as Record<string,unknown>)[key]);
  const daily:Daily[]=Array.from({length:days},(_,i)=>{const day=new Date(today-(days-1-i)*dayMs).toISOString().slice(0,10);return recorded.find(r=>r.day===day)??{day,visitors:0,sessions:0,pageViews:0};});
  type Count={label:string;count:number};
  const visits=results[16].results as Count[],activities=results[17].results as Count[];
  const botVisits=results[18].results as Count[],botActivities=results[19].results as Count[];
  const traffic={
    first:(results[20].results[0] as {first:string|null}).first,
    classes:trafficClasses.map(category=>({category,visits:Number(visits.find(x=>x.label===category)?.count??0),activities:Number(activities.find(x=>x.label===category)?.count??0)})),
    automation:[...new Set([...botVisits,...botActivities].map(x=>x.label))].map(signal=>({signal,visits:Number(botVisits.find(x=>x.label===signal)?.count??0),activities:Number(botActivities.find(x=>x.label===signal)?.count??0)})).sort((a,b)=>b.visits-a.visits||b.activities-a.activities),
  };
  return {days,since,until,traffic,searchConsoleVerified:(env as unknown as Record<string,unknown>).GULLAK_SEARCH_CONSOLE_VERIFIED==="true",summary:results[0].results[0] as Summary,previous:results[1].results[0] as Summary,daily,
    sources:results[3].results as Group[],devices:results[4].results as Group[],systems:results[5].results as Group[],browsers:results[6].results as Group[],modes:results[7].results as Group[],installation:results[8].results as Group[],features:results[9].results as Feature[],engines:results[10].results as {label:string;events:number}[],
    recent:value(11,"visitors"),accounts:value(12,"accounts"),savedGoals:value(13,"goals"),wins:value(14,"wins"),returning:value(15,"visitors")};
}
export type AnalyticsReport = Awaited<ReturnType<typeof analyticsReport>>;
