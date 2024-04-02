# TinCanTS

A typescript library for implementing TinCan functionalities. It is based on the TinCanJS library.

## Introduction

The existing TinCanJS library hasn't been maintained for more than 8 years, so it is prone to throw errors. This repository serves as an update of the old library, changing the behaviour of some components, or simply removing deprecated functions and methods.

## Main changes

The main changes with respect to TinCanJS are:

### XMLHttpRequest

The TinCanJS library was using XMLHttpRequests, which can be now deprecated in favour of `fetch` to make things simpler and more organized.

### Asynchronous Methods

Many methods for the TinCan and LRS objects relied on XMLHttpRequests calls, and therefore the response had to be handled through a callback function. 

We replaced all these synchronous calls for asynchronous ones using `async` and `await` to simplify things and ensure that all calls go through. 

Methods can still include callbacks in case the user wants to process the response or the possible error obtained from the call.

## How to use

If you are here, we assume you know what TinCan is, but just to give some context, TinCan or xAPI is an IEEE approved standard for learning technology that makes it possible to collect data about the wide range of experiences a person has. You can read more about it [here](https://xapi.com/).

The way the user interacts with the library is through the `TinCan` object. This object sends statements to the LRS, which is the one that stores the data. An LRS is a Learning Record Store, which is a system that stores learning records and uses the xAPI to retrieve and store data. In short, the LRS is the database where the user's interactions are stored. 

You might be wondering "But I am using an LMS, why do I need to store the data in an LRS?". The answer is that most LMSs have their own LRS, and when the TinCan library is created, it gets the LRS data from the window provided by the LMS. LMSs that support TinCan will have the information about the user (or `Actor`) and the `Activity` that the user is interacting with. To access this data, you can simply check the `window.location.href` and parse the information from there. Don't worry, everything has been abstracted in the library.

### Installation

To install the library, you can use npm:

```bash
npm install tincants
```

### Usage

If you are using the library from an LMS, we recommend you to use the `LMS` object. This way, you can access the methods that abstract the main interactions that the user will have with the library. _Note: This library is mainly used by AiCore, so the methods are tailored to the AiCore content. If you want to use it for your own content, you can use the `TinCan` object directly._

When you initialize the `LMS` object, it will automatically create a `TinCan` object with the LRS information provided by the LMS (Actor, Activity, LRS URL, etc.). This way, you don't have to worry about setting up the LRS information.

```typescript
import { LMS } from 'tincants';

const lms = new LMS();

// From here, you are already connected to the LRS and can start sending statements
// For example, you can tell that the user has watched a video
lms.setVideoCompleted()
    .then(() => {
        console.log('Video completed statement sent');
    })
    .catch((error) => {
        console.error('Error sending video completed statement', error);
    });

// Or you can check if the user has completed the video

const isVideoCompleted = lms.checkVideoCompletion()
```

If you want to be more specific about the statements you are sending and are still using an LMS, you can use the `tincan` property of the `LMS` object. This property is an instance of the `TinCan` object, but with the benefit of having the LRS information already set up.

```typescript
import { LMS } from 'tincants';

const lms = new LMS();
const tincan = lms.tincan;

// Now you can use the tincan object to send statements

tincan.sendStatement({
    actor: {
        name: 'John Doe',
        mbox: 'mailto: jd@hotmail.com'
    },
    verb: {
        id: 'http://adlnet.gov/expapi/verbs/completed',
        display: {
            'en-US': 'completed'
        }
    },
    object: {
        id: 'http://example.com/activities/video',
        definition: {
            name: {
                'en-US': 'Video'
            }
        }
    }
}).then(() => {
    console.log('Statement sent');
}).catch((error) => {
    console.error('Error sending statement', error);
});
```

If you are not using an LMS, you can use the `TinCan` object directly. However, you will need to provide the LRS information when creating the object. You need to set up the `Actor`, `Activity`, and LRS information. If you don't have any LRS, and you want to quickly test the library, you can create a free account in [Veracity](https://lrs.io/).

```typescript
import { TinCan } from 'tincants';

const actor = {
    name: 'John Doe',
    mbox: 'mailto:jd@hotmail.com' // The email preceded by mailto: (RFC 2368)
};
const activity = {
    id: 'http://example.com/activities/video', // You don't need to publish the activity, but still, many LRSs require the ID to be a valid URL (so you can write the ID preceded by http://)
    definition: {
        name: {
            'en-US': 'Example Video' // The name that will be displayed in the LRS
        }
    }
};
const lrs = {
    endpoint: 'https://lrs.io/xapi/',
    username: 'your_username',
    password: 'your_password'
};
const tincan = new TinCan({
  actor: new Agent(actor),
  activity: new Activity(activity),
});
tincan.addRecordStore(lrs);
```

As you can see, the `TinCan` object requires an `Actor` and an `Activity` object. The `Actor` object is the user that is interacting with the content, and the `Activity` object is the content itself. The `LRS` object is the Learning Record Store where the data will be stored.

### Debugging

If you want to see the requests that are being sent to the LRS, you can import the `Logger` object and set the `debug` property to `true`. This way, you will see the requests and responses in the console.

```typescript
import { Logger } from 'tincants';
import { LMS } from 'tincants';

Logger.debug = true;

const lms = new LMS();
```

This will show all the steps that are taking place through the console in the following format:

```
[TinCan] init
[TinCan] addRecordStore
[TinCan] sendStatement
...
```

### LMS Object

The `LMS` object in this library is tailored to the AiCore content. It has methods to send statements that are specific to the AiCore content. If you are using this library for your own content, you can use the `TinCan` object directly.

With that said, the `LMS` object has methods for:

- Setting content as completed (`set___Completed`)
- Checking content completion  (`check___Completion`)
- Setting content as launched (`set___Launched`)

The interface follows the same pattern for each component. So, for example, if you want to set a video as completed, you can use the `setVideoCompleted` method. If you want to check if the video is completed, you can use the `checkVideoCompletion` method.

Then, for specific components, it has methods for:

- Setting the video progress (`setVideoProgress`)
- Getting the video progress (`getVideoProgress`)
- Getting the assessment state (`getAssessmentState` - whether it is passed, failed)
- Setting an assessment as failed or passed (`setAssessmentCompleted` will call the `setAssessmentPassed` or `setAssessmentFailed` methods depending on the score)
- Setting the user's score in an assessment (`setAssessmentScore`)
- Getting the user's score in an assessment (`getAssessmentScore`)
- Setting the user's responses in an assessment (`setAssessmentResponses`)
- Getting the user's responses in an assessment (`getAssessmentResponses`)

A final note is that all the methods return promises, make sure to take this into account when using them.

### Sending Statements

Whether you are using the `LMS` object or the `TinCan` object directly, you can send statements using the `sendStatement` method. This method receives an object with the statement information and returns a promise. The object should have the following structure `Actor - Verb - Object` or in other words `Who - Did - What`

```typescript
{
    // Who
    actor: {
        name: 'John Doe',
        mbox: 'mailto:jd@hotmail.com'
    },
    // Did
    verb: {
        id: 'http://adlnet.gov/expapi/verbs/completed',
        display: {
            'en-US': 'completed'
        }
    },
    // What
    object: {
        id: 'http://example.com/activities/video',
        definition: {
            name: {
                'en-US': 'Video'
            }
        }
    }
}
```

The `object` property is the content that the user is interacting with. If you are using the `LMS` object, the `object` property is already set up and you can access it though `lms.activity`.

A few important notes:

- You can use any `Verb` to define what the user did. However, it is recommended to use the [official verbs](https://registry.tincanapi.com/#home/verbs) to ensure that the LRS can interpret the statement correctly.
- The `Verb` id should be a valid URL. You can use the official verbs URL or create your own.
- The `Object` id should be a valid URL. You can use the official activities URL or create your own.
- Some LMSs will mark the content as completed as soon as they receive a statement with the `completed` verb with the `object` being the content that the user is interacting with.
    - For example, let's say that you have an activity whose id is `http://example.com/activities/video`.
    - If you send a statement with the `completed` verb and the `object` being `http://example.com/activities/video`, the LMS will mark the video as completed.
    - But if you send a statement with the `completed` verb and the `object` being `http://example.com/activities/video/1`, the LMS will not mark the video as completed.
    - __This is not the same for all LMSs__
    - Some LMSs will mark the content as completed as soon as they receive a statement with the `completed` verb, regardless of the `object`. Make sure to check or test this behaviour with your LMS.

### Getting Statements

Getting statements is more complicated than sending them. The `LRS` object has a `retrieveStatements` method that can be used to get statements from the LRS. The method will retrieve the statements that match the query provided. The query should be an object with the properties that you want to filter the statements by.

```typescript
import { TinCan } from 'tincants';

const tincan = new TinCan(); // Initialize the TinCan object with the LRS information. Check the Usage section for more information.

const query = {
    agent: {
        mbox: 'mailto:example@hotmail.com'
    },
    verb: {
        id: 'http://adlnet.gov/expapi/verbs/completed'
    },
    activity: {
        id: 'http://example.com/activities/video'
    }
};
const statements = await tincan.retrieveStatements(query);
```

This will return an array of statements that match the query provided. If that's enough, you can skip the rest of this section. _BUT_ there are some drawbacks to this method:

- The LMSs we have tested don't allow you to retrieve statements from the LRS. This is because the LMSs don't have the necessary permissions to do so.
- For the reason above, you need to make a call to your LRS directly. This means that you need to have the LRS information and make a call to the LRS endpoint, which consumes more time and resources.
- You might want to filter even further, and might be difficult to know all the types withing the `query` object.

What's the solution for storing and getting the statements? We need to send the statements so they are stored in the LRS, so the `set___` methods are needed. But in order to get the statements, we need to use the `setState` method. This method allows us to store keys and values in the tincan instance that can be accessed when opening the content. It's actually a nice trick that adds the state as a number at the end of the `window.location.href`. 

```typescript
import { TinCan } from 'tincants';

const tincan = new TinCan(); // Initialize the TinCan object with the LRS information. Check the Usage section for more information.

// Set the state
tincan.setState('video', 'completed');

// Get the state

const videoState = tincan.getState('video');
```

That's it! When you send statements through the `LMS` object, the method is abstracted so that it sends the statement and sets the state. When you want to get the statements, you can use the `getState` method to get the state of the content.

The following is an example of how you can use the `setState` and `getState` using React:

```typescript
  const [isVideoCompleted, setIsVideoCompleted] = React.useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const getVideoProgress = async () => {
      const progress = await lms.getVideoProgress();
      if (progress) {
        video.currentTime = progress;
      }
    };
    const checkVideoProgress = () => {
      if (!video.duration) return;
      const percentageWatched = (video.currentTime / video.duration) * 100;
      if (percentageWatched > 90) {
        setIsVideoCompleted(true);
      }
    };

    const setVideoProgress = async () => {
      await lms.setVideoProgress(video.currentTime);
    };

    const interval = setInterval(setVideoProgress, 10000); // Save the video progress every 10 seconds

    getVideoProgress();
    video.addEventListener('timeupdate', checkVideoProgress);

    // Cleanup function to remove event listener
    return () => {
      video.removeEventListener('timeupdate', checkVideoProgress);
      clearInterval(interval);
      unsubscribe();
    }
  }, [videoRef]);
```

In this example, we are setting the video progress every 10 seconds. When the video is completed, we set the video as completed. This is just an example, you can set the video as completed when the user has watched 90% of the video, or when the video has finished playing.

## Support

If you have any questions or need help with the library, you can contact [Ivan](www.github.com/IvanYingX)

