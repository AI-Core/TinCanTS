import {TinCan} from './TinCan';
import { LRS } from './LRS';
import { Logger } from './Logger';
import { Verb } from './Verb';
import { Activity } from './Activity';
import { Statement } from './Statement';
import {Agent} from './Agent';
import { QueryCfg } from './interfaces';

// Logger.enableDebug();
const tincan = new TinCan({url: "https://d3pg1c2bhy6429.cloudfront.net/120531/wbDhuuAqobaDm8Gj-NAmOYuD7WGSjxoV0v-Tp9FY/output/lab/index.html?endpoint=https%3A%2F%2Fapp.learnupon.com%2Ftincan_api%2F&actor=%7B%22name%22%3A%20%5B%22Ivan%20Ying%20Xuan%22%5D%2C%20%22mbox%22%3A%20%5B%22mailto%3Aivan%40theaicore.com%22%5D%7D&auth=16c620cb6d8640e0fc0d&activity_id=http%3A%2F%2Fexample.com%2Fcourse-id&registration=fcee5a6f-d69e-4ec8-8553-7129d8d60f65&enroll_id=197020339&course_id=0&component_id=5333637&lup_tincandata_id=13711168&slt=16c620cb6d8640e0fc0d"});
console.log(tincan)
const lrs = new LRS({
    endpoint: "https://aicore-dev.lrs.io/xapi/",
    username: "ehiecd",
    password: "firtuz",
    allowFail: false
})

const getStatement = async (lrs: LRS, params: QueryCfg) => {
  const result = await lrs.queryStatements(params)
  console.log(result)
  console.log(result?.statements?.length)
}

getStatement(lrs, {
  params: {
    agent: tincan.actor as Agent,
    verb: new Verb({id: "http://adlnet.gov/expapi/verbs/completed"}),
    activity: new Activity({id: tincan.activity?.id}),
    limit: 5
  }
})




// // getAbout(lrs)

// // const verb = new Verb({id: "http://adlnet.gov/expapi/verbs/attempted"})
// // const activity = new Activity({id: "http://example.com/course-id"})
// const statement = new Statement({
//     actor: tincan.actor as Agent,
//     verb: {
//         id: "http://adlnet.gov/expapi/verbs/completed",
//         display: { "en-US": "completed" }
//     },
//     target: {
//         id: tincan.activity?.id,
//         definition: {
//             name: { "en-US": "Comprehensions" },
//         }
//     },
//     object: {
//         id: tincan.activity?.id,
//         definition: {
//             name: { "en-US": "Comprehensions" },
//             description: { "en-US": "Comprehensions" }
//         }
//     }
// })

// console.log(statement)
// const saveStatement = async (lrs: LRS, statement: Statement) => {
//     const result = await lrs.saveStatement(statement)
//     console.log(result)
// }   

// saveStatement(lrs, statement)
// console.log(tincan)
// // console.log(lrs)
// // console.log(verb)
// // console.log(activity)
// console.log(statement)