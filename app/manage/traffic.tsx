import type {AnalyticsReport} from "../analytics-report";

const format=(n:number)=>n.toLocaleString("en-US");
const percent=(n:number,total:number)=>total?`${Math.round(n/total*100)}%`:"—";
const labels={human:"Likely humans",bot:"AI / bots",unknown:"Unknown"};
const descriptions={human:"Browser interaction with no detected automation.",bot:"Crawler identity or automation signal detected.",unknown:"Not enough evidence, including earlier activity."};
const agents:Record<string,string>={"openai-training":"OpenAI · GPTBot","openai-search":"OpenAI · OAI-SearchBot","openai-assistant":"OpenAI · ChatGPT-User","claude-training":"Anthropic · ClaudeBot","claude-search":"Anthropic · Claude-SearchBot","claude-assistant":"Anthropic · Claude-User","perplexity-search":"Perplexity · PerplexityBot","perplexity-assistant":"Perplexity · Perplexity-User","meta-ai":"Meta AI crawler","common-crawl":"Common Crawl","search-crawler":"Search crawler","other-bot":"Other bot","other-automation":"Other crawler / HTTP tool"};
function identity(signal:string) {
  if(signal==="browser-automation")return {name:"Automated browser",evidence:"WebDriver / headless browser signal"};
  const [verification,agent]=signal.split(":");
  return {name:agents[agent]??"Other automation",evidence:verification==="verified"?"Cloudflare verified bot; agent name declared":"Declared user agent"};
}
export default function TrafficSplit({traffic:t}:{traffic:AnalyticsReport["traffic"]}) {
  const visits=t.classes.reduce((n,x)=>n+x.visits,0),activities=t.classes.reduce((n,x)=>n+x.activities,0);
  return <section className="manage-panel manage-traffic" aria-labelledby="traffic-heading">
    <div className="manage-panel-heading"><div><h2 id="traffic-heading">Humans and AI / bots</h2><p>Who is loading Gullak, and who is using its features?</p></div><span className="manage-check">Estimated classification</span></div>
    <div className="manage-traffic-cards">{t.classes.map(row=><article className={`manage-traffic-${row.category}`} key={row.category}>
      <h3>{labels[row.category]}</h3><p>{descriptions[row.category]}</p>
      <dl><div><dt>Visits <small>Page loads</small></dt><dd>{format(row.visits)} <small>{percent(row.visits,visits)}</small></dd></div><div><dt>Activities <small>Feature events</small></dt><dd>{format(row.activities)} <small>{percent(row.activities,activities)}</small></dd></div></dl>
    </article>)}</div>
    {!!visits&&<div className="manage-traffic-bar" role="img" aria-label={`Page loads: ${t.classes.map(x=>`${labels[x.category]} ${x.visits}`).join(", ")}.`}>
      {t.classes.filter(x=>x.visits).map(x=><span className={`manage-traffic-${x.category}`} key={x.category} style={{width:`${x.visits/visits*100}%`}}/>)}</div>}
    <p className="manage-note">Visits count successful home and privacy page loads, including crawlers that do not run JavaScript. They are not unique people. Activities count reported feature events; page views and the interaction-detection event are excluded. The two totals measure different things.</p>
    <details className="manage-detail"><summary>Detected automation and how the split works</summary>
      {t.automation.length?<div className="manage-table-scroll" tabIndex={0} role="region" aria-label="Scrollable automation breakdown"><table><thead><tr><th>Agent / signal</th><th>Visits</th><th>Activities</th></tr></thead><tbody>{t.automation.map(row=>{const agent=identity(row.signal);return <tr key={row.signal}><td>{agent.name}<small className="manage-traffic-evidence">{agent.evidence}</small></td><td>{format(row.visits)}</td><td>{format(row.activities)}</td></tr>;})}</tbody></table></div>:<p className="manage-no-data">No automation detected in this period.</p>}
      <ul className="manage-traffic-method"><li><strong>Likely humans:</strong> a browser reports a trusted tap or key press and no automation signal. Passive visits remain unknown.</li><li><strong>AI / bots:</strong> recognised AI or search crawler names, HTTP tools, headless browsers, or WebDriver. A verified bot flag is used only when supplied by the hosting platform.</li><li><strong>Unknown:</strong> insufficient signals, disguised automation, or activity recorded before this split existed. Signing in alone does not prove someone is human.</li></ul>
      <p className="manage-note">Browser signals and user-agent names can be spoofed. This is an estimate, not proof of identity. A person using Goalie or arriving from an AI recommendation is still human traffic when interaction signals support it. Bots blocked before reaching Gullak are not counted.</p>
    </details>
    <p className="manage-note">{t.first?`Page request records begin ${new Date(t.first).toLocaleString("en-US",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})} UTC within the retained data.`:"Page request tracking starts with this update."} Earlier activity remains unknown; previously excluded bot traffic cannot be recovered. Other dashboard reports include all collected browser traffic.</p>
  </section>;
}
