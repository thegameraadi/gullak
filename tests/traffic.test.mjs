import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyTraffic,trafficPage} from '../lib/traffic-classification.ts';
const browser='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
test('AI assistants, AI crawlers, search crawlers and HTTP tools are separated from browser visits',()=>{
  for(const agent of ['GPTBot/1.3','Mozilla/5.0; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot','ChatGPT-User/1.0','ClaudeBot/1.0','Claude-SearchBot/1.0','Claude-User/1.0','PerplexityBot/1.0','Perplexity-User/1.0','Googlebot/2.1','Google-InspectionTool/1.0','curl/8.0','python-requests/2.0','SomeSpider/1'])assert.equal(classifyTraffic(agent).category,'bot',agent);
  assert.equal(classifyTraffic('NotGPTBotFake/1').category,'unknown');
  assert.equal(classifyTraffic('Mozilla/5.0 Safari/605 private_goal=10000').category,'unknown');
  assert.equal(classifyTraffic('GPTBot/1.3').signal,'declared:openai-training');
});
test('human interaction is an estimate and bot evidence takes precedence',()=>{
  assert.deepEqual(classifyTraffic(browser),{category:'unknown',signal:'no-human-signal'});
  assert.deepEqual(classifyTraffic(browser,{interaction:true,automation:false}),{category:'human',signal:'browser-interaction'});
  assert.equal(classifyTraffic(browser,{interaction:true,automation:true}).category,'bot');
  assert.equal(classifyTraffic('Mozilla/5.0 HeadlessChrome/130 Safari/537',{interaction:true,automation:false}).category,'bot');
  assert.equal(classifyTraffic('GPTBot/1.3',{interaction:true,automation:false}).category,'bot');
  assert.equal(classifyTraffic(browser,{interaction:true,automation:false},true).signal,'verified:other-bot');
  assert.equal(classifyTraffic('GPTBot/1.3',undefined,true).signal,'verified:openai-training');
  assert.equal(classifyTraffic('',{interaction:true,automation:false}).category,'unknown');
});
test('only successful document candidates count, excluding private routes and browser prefetch',()=>{
  const req=(path='/',options={})=>new Request('https://gullak.test'+path,options);
  assert.equal(trafficPage(req('/?private=not-stored')),'home');assert.equal(trafficPage(req('/privacy')),'privacy');
  for(const path of ['/manage','/manage/extra','/api/manage','/api/account','/sitemap.xml','/robots.txt','/favicon.svg','/signin-with-chatgpt'])assert.equal(trafficPage(req(path)),null);
  for(const headers of [{RSC:'1'},{'next-router-prefetch':'1'},{Purpose:'prefetch'},{'Sec-Purpose':'prefetch;prerender'},{DNT:'1'},{'Sec-GPC':'1'}])assert.equal(trafficPage(req('/',{headers})),null);
  assert.equal(trafficPage(req('/',{method:'HEAD'})),null);assert.equal(trafficPage(req('/',{method:'POST',body:'private'})),null);
});
