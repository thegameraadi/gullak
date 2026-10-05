import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAnalyticsBatch,trafficSource,clientPlatform,actionAnalyticsEvent} from '../lib/analytics-contract.ts';
const batch=()=>({visitorId:crypto.randomUUID(),sessionId:crypto.randomUUID(),source:'direct',standalone:false,events:[{id:crypto.randomUUID(),name:'page_view',engine:'none'}]});
test('analytics accepts bounded anonymous usage without financial or identity fields',()=>{
 const b=batch();assert.deepEqual(parseAnalyticsBatch(b),b);
 for(const field of ['email','amountCents','goalName','chatText','userId','referrer','ip'])assert.equal(parseAnalyticsBatch({...b,[field]:'private content'}),null);
 assert.equal(parseAnalyticsBatch({...b,events:[{...b.events[0],text:'private conversation'}]}),null);
});
test('analytics rejects malformed IDs, unknown events, arbitrary sources and oversized batches',()=>{
 const b=batch();for(const change of [{visitorId:'owner'},{sessionId:'x'},{source:'private-email@example.com'},{standalone:'true'},{events:[]},{events:Array(13).fill(b.events[0])},{events:[{...b.events[0],name:'balance_50000'}]},{events:[{...b.events[0],engine:'secret'}]}])assert.equal(parseAnalyticsBatch({...b,...change}),null);
 assert.equal(parseAnalyticsBatch(null),null);assert.equal(parseAnalyticsBatch([]),null);
});
test('reply mode is recorded only for replies and source classification never keeps a URL',()=>{
 const b=batch();b.events[0].engine='ai';assert.equal(parseAnalyticsBatch(b).events[0].engine,'none');
 b.events[0].name='gullie_reply_received';assert.equal(parseAnalyticsBatch(b).events[0].engine,'ai');
 assert.equal(trafficSource('https://www.google.com/search?q=personal+detail',''),'google');
 assert.equal(trafficSource('https://google.com.evil.invalid/',''),'other');
 assert.equal(trafficSource('https://github.com/thegameraadi/gullak',''),'github');
 assert.equal(trafficSource('','bay-area-builders'),'bay-area-builders');
 assert.equal(trafficSource('','friends'),'friends');
 assert.equal(trafficSource('https://gullak.test/manage','', 'https://gullak.test'),'direct');
 assert.equal(trafficSource('','private-content'),'other');assert.equal(trafficSource('',''),'direct');
});
test('platform categories and completed actions are coarse and omit action payloads',()=>{
 assert.deepEqual(clientPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'),{device:'Phone',os:'iOS',browser:'Safari'});
 assert.equal(clientPlatform('Mozilla/5.0 Android 15 Mobile Chrome/130').device,'Phone');
 assert.equal(actionAnalyticsEvent('createGoal',{name:'Private goal',targetCents:12000}),'goal_created');
 assert.equal(actionAnalyticsEvent('closeGoal',{reason:'changed'}),null);
 assert.equal(actionAnalyticsEvent('closeGoal',{reason:'bought'}),'purchase_recorded');
 assert.equal(actionAnalyticsEvent('settings',{gullieNotes:['private preference']}),null);
 assert.equal(actionAnalyticsEvent('settings',{currency:'INR'}),'currency_changed');
 assert.equal(actionAnalyticsEvent('reset',{}),null);assert.equal(actionAnalyticsEvent('constructor',{}),null);
});
test('traffic classification accepts only a load ID and two boolean signals, preserving old clients',()=>{
 const b=batch();assert.deepEqual(parseAnalyticsBatch(b),b);
 const value={...b,pageLoadId:crypto.randomUUID(),signals:{automation:false,interaction:true}};assert.deepEqual(parseAnalyticsBatch(value),value);
 for(const change of [{pageLoadId:'raw-url'},{signals:{automation:'false',interaction:true}},{signals:{automation:false,interaction:true,ip:'private'}},{signals:[]},{signals:{automation:false}},{signals:null}])assert.equal(parseAnalyticsBatch({...b,...change}),null);
});
