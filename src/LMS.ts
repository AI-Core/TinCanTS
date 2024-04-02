/**
 * The TinCan Object can work if you are working locally, but you need to add the actor, verb, and object to the statement.
 * However, it is more common to use TinCan objects inside an LMS like LearnUpon.
 * 
 * This script defines the most common functions you will need to use TinCan objects inside an LMS.
 **/
import { TinCan } from "./TinCan";
import { Logger } from "./Logger";
import { Activity, ActivityCfg } from "./Activity";
import { Statement } from "./Statement";
import { Agent } from "./Agent";

interface IAssessmentResponse {
  question_idx: number;
  question: string;
  code: string | null;
  image_url: string | null;
  answers: {
    answer_idx: number;
    answer: string;
    selected: boolean;
    correct: boolean;
    code: string | null;
    image_url: string | null;
  }[];
}

export class LMS {
  tincan: TinCan;

  /**
   * Logs a message.
   * 
   * @param message - The message to be logged.
   */
  log(message: string): void {
    Logger.log(message, "LMS");
  }

  constructor() {
    this.log("constructor");
    this.tincan = new TinCan({ url: window.location.href });
  }

  /**
   * Checks the completion status of an activity.
   * @param activityId - The ID of the activity to check.
   * @param completionVerb - The completion verb to compare against. Defaults to "completed".
   * @returns A promise that resolves to a boolean indicating whether the activity is completed.
   */
  protected async checkCompletion(
    activityId: string,
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("checkCompletion");
    const getState = await this.tincan.getState(activityId);
    if (getState?.contents) {
      return getState.contents === completionVerb;
    }
    return false;
  }
    /**
   * Send a statement to the LMS to record that the user has completed a lesson or task.
   * If no id is provided, the current activity will be used.
   * @param activity The activity that the user has completed. If no activity is provided, the current activity will be used.
   * The provided activity must be an object with two properties: id and definition.
   **/
  protected async setActivityCompleted(
    activity?: ActivityCfg,
  ): Promise<void> {
    this.log("setActivityCompletion");
    // Send a statement to the LMS
    await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: {
          "en-US": "completed",
        },
      },
      object: activity ? new Activity(activity) : this.tincan.activity as Activity,
    }));
  }

  /**
   * Sets the activity as launched and sends a statement to the LMS.
   * @param activity The activity configuration.
   * @returns A promise that resolves when the statement is sent.
   */
  protected async setActivityLaunched(
    activity?: ActivityCfg,
  ): Promise<void> {
    this.log("setLaunched");
    // Send a statement to the LMS
    await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/launched",
        display: {
          "en-US": "launched",
        },
      },
      object: activity ? new Activity(activity) : this.tincan.activity as Activity,
    }));
  }

  /**
   * Sets the activity as experienced and sends a statement to the LMS.
   * 
   * @param activity The activity configuration.
   */
  protected async setActivityExperienced(
    activity?: ActivityCfg,
  ): Promise<void> {
    this.log("setExperienced");
    // Send a statement to the LMS
    await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/experienced",
        display: {
          "en-US": "experienced",
        },
      },
      object: activity ? new Activity(activity) : this.tincan.activity as Activity,
    }));
  }

  /**
   * Sets the activity as passed with an optional score.
   * 
   * @param activity - The activity configuration.
   * @param score - The score for the activity. Defaults to 1 if not provided.
   * @returns A Promise that resolves when the statement is sent.
   */
  protected async setActivityPassed(
    activity?: ActivityCfg,
    score?: number,
  ): Promise<void> {
    this.log("setPassed");
    const results = await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/passed",
        display: {
          "en-US": "passed",
        },
      },
      object: activity ? new Activity(activity) : this.tincan.activity as Activity,
      result: {
        score: {
          raw: score ?? 1,
        },
      },
    }));
    this.log("setPassed: " + JSON.stringify(results));
  }

  /**
   * Sets the activity as failed with an optional score.
   * 
   * @param activity - The activity configuration.
   * @param score - The score for the failed activity.
   * @returns A promise that resolves when the statement is sent.
   */
  protected async setActivityFailed(
    activity?: ActivityCfg,
    score?: number,
  ): Promise<void> {
    this.log("setFailed");
    const results = await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/failed",
        display: {
          "en-US": "failed",
        },
      },
      object: activity ? new Activity(activity) : this.tincan.activity as Activity,
      result: {
        score: {
          raw: score ?? 0,
        },
        success: false,
        completion: false,
        response: "The user failed the activity",
        extensions: {
          "http://adlnet.gov/expapi/activities/attempt": 1,
        },
      },
    }));
    this.log("setFailed: " + JSON.stringify(results));
  }

  /**
   * Send a state to the LMS to record that the user has completed a task or lesson
   * @param activityId The id of the activity that the user has completed.
   * @param completionVerb The verb to use to record the completion. Defaults to "completed".
   * @param completionStatus The state to use to record the completion. Defaults to "true".
   * If the activityId is provided, the state will be stored as an object with the activityId as the key and the {completionVerb: completionStatus} as the value.
   **/
  protected async setStateCompleted(
    activityId: string,
    activityType: "lesson" | "project" | "milestone" | "task" | "practical-step" | "practical" | "video" | "notebook",
    completionVerb = "completed",
  ): Promise<void> {
    this.log("setStateCompletion");
    this.log(`setStateCompleted: ${activityId} ${completionVerb} ${activityType} `);
    const response = await this.tincan.setState(activityId, completionVerb);
    this.log(`setStateCompleted: ${JSON.stringify(response)}`);
    // When getting the state, there are some cases to consider:
    // 1. If there is no existing state, the response will be an error, and we can bypass it
    // 2. If there is an existing state, and the key doesn't exist, the response will be the last set state, regardless of the key
    // 3. If there is an existing state, and the key exists, the response will be the corresponding value
    // Thus, we set another random state, so any request to a non-existing key will return the last set state
    await this.tincan.setState("random", "");
    this.log(`setStateCompleted for random: ${JSON.stringify(response)}`);
  }

  // LESSONS
  /**
   * Checks the completion status of a lesson.
   * @param completionVerb The verb indicating the completion status (default: "completed").
   * @returns A promise that resolves to a boolean indicating whether the lesson is completed.
   * Notes: The lesson id is the activity id. The method is the same as checkProjectCompletion, but it's here for easier access.
   */
  async checkLessonCompletion(
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("Check Lesson Completion");
    const lessonId = this.tincan.activity?.id as string;
    return await this.checkCompletion(lessonId, completionVerb);
  }

  /**
   * Sets the lesson as launched.
   * @returns A Promise that resolves to void.
   */
  async setLessonLaunched(): Promise<void> {
    this.log("setLessonLaunched");
    const lessonId = this.tincan.activity?.id as string;
    const lessonCfg: ActivityCfg = {
      id: lessonId,
      definition: {
        name: {
          "en-US": lessonId,
        },
      },
    };
    await this.setActivityLaunched(lessonCfg);
  }

  /**
   * Sets the lesson as completed in the LMS. A lesson is completed when all the mandatory elements in it are completed.
   * Usually, they are Notebook, Practical, and Assessment. It depends on the end user when to call this method.
   * 
   * @param completionVerb The verb indicating the completion status (default: "completed").
   * @returns A Promise that resolves when the lesson is set as completed.
   */
  async setLessonCompleted(
    completionVerb: string = "completed",
  ): Promise<void> {
    this.log("set Lesson Completed");
    const lessonId = this.tincan.activity?.id as string
    const lessonCfg: ActivityCfg = {
      id: lessonId,
      definition: {
        name: {
          "en-US": lessonId,
        },
      },
    };
    await this.setActivityCompleted(lessonCfg);
    await this.setStateCompleted(lessonId, "lesson", completionVerb);
  }


  // PROJECTS
  /**
   * Checks the completion status of a project.
   * @param completionVerb The verb indicating completion status (default: "completed").
   * @returns A promise that resolves to a boolean indicating whether the project is completed.
   */
  async checkProjectCompletion(
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("Check Project Completion");
    const projectId = this.tincan.activity?.id as string
    return await this.checkCompletion(projectId, completionVerb);
  }

  /**
   * Sets the project as launched.
   * @returns A promise that resolves when the project is set as launched.
   */
  async setProjectLaunched(): Promise<void> {
    this.log("setProjectLaunched");
    const projectId = this.tincan.activity?.id as string;
    const projectCfg: ActivityCfg = {
      id: projectId,
      definition: {
        name: {
          "en-US": projectId,
        },
      },
    };
    await this.setActivityLaunched(projectCfg);
  }

  /**
   * Sets the project as completed in the LMS.
   * 
   * @param completionVerb The verb to indicate completion (default: "completed").
   * @returns A Promise that resolves when the project is set as completed.
   */
  async setProjectCompleted(
    completionVerb: string = "completed",
  ): Promise<void> {
    this.log("setCompletion");
    // Send a statement to the LMS
    const projectCfg: ActivityCfg = {
      id: this.tincan.activity?.id as string,
      definition: {
        name: {
          "en-US": this.tincan.activity?.id as string
        }
      }
    };
    await this.setActivityCompleted(projectCfg);
    const projectId = this.tincan.activity?.id as string;
    await this.setStateCompleted(projectId, "project", completionVerb);
  }

  /**
   * Checks the completion status of a milestone.
   * @param milestoneId - The ID of the milestone to check.
   * @param completionVerb - The completion verb to use (default: "completed").
   * @returns A Promise that resolves to a boolean indicating whether the milestone is completed.
   */
  async checkMilestoneCompletion(
    milestoneId: string,
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("Check Milestone Completion");
    const projectId = this.tincan.activity?.id as string
    const query = `${projectId}/${milestoneId}`;
    return await this.checkCompletion(query, completionVerb);
  }

  /**
   * Sets a milestone as completed.
   * 
   * @param milestoneId - The ID of the milestone.
   * @param completionVerb - The completion verb to use (default: "completed").
   * @param milestoneName - The name of the milestone (optional).
   * @returns A Promise that resolves when the milestone is set as completed.
   */
  async setMilestoneCompleted(
    milestoneId: string,
    completionVerb: string = "completed",
    milestoneName?: string,
  ): Promise<void> {
    this.log("setCompletion");
    const projectId = this.tincan.activity?.id as string
    const projectMilestoneId = `${projectId}/${milestoneId}`;
    const milestoneCfg: ActivityCfg = {
      id: projectMilestoneId,
      definition: {
        name: {
          "en-US": milestoneName ?? projectMilestoneId,
        },
      },
    };
    await this.setActivityCompleted(milestoneCfg);
    await this.setStateCompleted(projectMilestoneId, "milestone", completionVerb);
  }

  /**
   * Checks the completion status of a task within a milestone.
   * 
   * @param milestoneId - The ID of the milestone.
   * @param taskId - The ID of the task.
   * @param completionVerb - The completion verb to check for (default: "completed").
   * @returns A Promise that resolves to a boolean indicating whether the task is completed.
   */
  async checkTaskCompletion(
    milestoneId: string,
    taskId: string,
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("Check Task Completion");
    const projectId = this.tincan.activity?.id as string; // For projects, the activity id is the project id
    const query = `${projectId}/${milestoneId}/${taskId}`;
    return await this.checkCompletion(query, completionVerb);
  }

  /**
   * Sets a task as completed in the LMS.
   * 
   * @param milestoneId - The ID of the milestone the task belongs to.
   * @param taskId - The ID of the task.
   * @param completionVerb - The verb indicating the completion status (default: "completed").
   * @param taskName - The name of the task (optional).
   * @returns A Promise that resolves to void or a Response object.
   */
  async setTaskCompleted(
    milestoneId: string,
    taskId: string,
    completionVerb: string = "completed",
    taskName?: string,
  ): Promise<void | Response> {
    this.log("Set Task Completion");
    const projectId = this.tincan.activity?.id as string; // For projects, the activity id is the project id
    const projectTaskId = `${projectId}/${milestoneId}/${taskId}`;
    const taskCfg: ActivityCfg = {
      id: projectTaskId,
      definition: {
        name: {
          "en-US": taskName ?? projectTaskId,
        },
      }
    };
    await this.setActivityCompleted(taskCfg);
    const stateResponse = await this.setStateCompleted(projectTaskId, "task", completionVerb);
    return stateResponse;
  }

  // PRACTICALS
  /**
   * Checks the completion status of a practical activity.
   * 
   * @param practicalId - The ID of the practical activity.
   * @param completionVerb - The completion verb to check against (default: "completed").
   * @returns A Promise that resolves to a boolean indicating whether the practical activity is completed.
   */
  async checkPracticalCompletion(
    practicalId: string,
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("Check Practical Completion");
    const activityId = `${this.tincan.activity?.id}/practical/${practicalId}`;
    return await this.checkCompletion(activityId, completionVerb);
  }

  /**
   * Sets the practical as launched.
   * @param practicalId - The ID of the practical.
   * @returns A Promise that resolves when the practical is set as launched.
   */
  async setPracticalLaunched(
    practicalId: string,
  ): Promise<void> {
    this.log("setPracticalLaunched");
    const activityId = `${this.tincan.activity?.id}/practical/${practicalId}`;
    const activityCfg = {
      id: activityId,
      definition: {
        name: {
          "en-US": activityId,
        },
      },
    };
    await this.setActivityLaunched(activityCfg);
  }

  /**
   * Sets the practical completion status for a specific practical.
   * 
   * @param practicalId - The ID of the practical.
   * @param completionVerb - The completion verb to be used (default: "completed").
   * @returns A Promise that resolves to void or a Response object.
   */
  async setPracticalCompleted(
    practicalId: string,
    completionVerb: string = "completed",
  ): Promise<void | Response> {
    this.log("Set Practical Completion");
    const activityId = `${this.tincan.activity?.id}/practical/${practicalId}`;
    // const activityCfg = {
    //   id: activityId,
    //   definition: {
    //     name: {
    //       "en-US": activityId,
    //     },
    //   },
    // };
    // await this.setActivityCompleted(activityCfg);
    const stateResponse = await this.setStateCompleted(activityId, "practical", completionVerb);
    return stateResponse;
  }


  /**
   * Checks the completion status of a practical step.
   * 
   * @param practicalId - The ID of the practical.
   * @param stepNumber - The step number of the practical.
   * @returns A Promise that resolves to a boolean indicating whether the step is completed or not.
   */
  async checkPracticalStepCompletion(
    practicalId: string,
    stepNumber: number,
  ): Promise<boolean> {
    this.log("Check Practical Step Completion");
    const activityId = `${this.tincan.activity?.id}/practical/${practicalId}/step/${stepNumber}`;
    return await this.checkCompletion(activityId);
  }

  /**
   * Sets a practical step as completed in the LMS.
   * 
   * @param practicalId - The ID of the practical.
   * @param stepNumber - The number of the step.
   * @returns A Promise that resolves to void or a Response object.
   */
  async setPracticalStepCompleted(
    practicalId: string,
    stepNumber: number,
  ): Promise<void | Response> {
    this.log("setCompletion");
    // Send a statement to the LMS
    const activityId = `${this.tincan.activity?.id}/practical/${practicalId}/step/${stepNumber}`;
    // const activityCfg = {
    //   id: activityId,
    //   definition: {
    //     name: {
    //       "en-US": activityId,
    //     },
    //   },
    // };
    // await this.setActivityCompleted(activityCfg);
    const stateResponse = await this.setStateCompleted(activityId, "practical-step", "completed");
    return stateResponse;
  }


  // ASSESSMENTS
  /**
   * Retrieves the assessment state from the LMS.
   * @returns A Promise that resolves to a string representing the assessment state, or null if the state is not available.
   */
  async getAssessmentState(): Promise<string | null> {
    this.log("Check Assessment Completion");
    const activityId = this.tincan.activity?.id as string;
    const assessmentId = activityId + "/assessment";
    const getState = await this.tincan.getState(assessmentId);
    if (getState?.contents) {
      return getState.contents;
    }
    return null;
  }

  /**
   * Retrieves the assessment responses.
   * @returns A Promise that resolves to a string representing the responses to the assessment.
   * The result is a stringified JSON object.
   * Example: [{"question1": "question body", "answers": [{"answer1": "answer body", "correct": true, "selected": true}, ...]}, ...]
   */
  async getAssessmentResponses(): Promise<string | null> {
    this.log("Check Assessment Responses");
    const activityId = this.tincan.activity?.id as string;
    const assessmentId = activityId + "/assessment/response";
    const getState = await this.tincan.getState(assessmentId);
    if (getState?.contents) {
      return getState.contents;
    }
    return null;
  }

  /**
   * Retrieves the assessment score for the activity.
   * @returns A Promise that resolves to a number representing the assessment score, or null if the score is not available.
   */
  async getAssessmentScore(): Promise<number | null> {
    this.log("getAssessmentScore");
    const activityId = this.tincan.activity?.id as string;
    const query = activityId + "/assessment/score";
    const getState = await this.tincan.getState(query);
    if (getState?.contents) {
      // contents should be a stringified number
      try {
        return parseFloat(getState.contents);
      } catch (e) {
        this.log("getAssessmentScore: Error parsing the score");
      }
    }
    return null;
  }

  /**
   * Sets the assessment as launched.
   * @returns A Promise that resolves to void.
   */
  async setAssessmentLaunched(): Promise<void> {
    this.log("setAssessmentLaunched");
    const activityId = this.tincan.activity?.id as string;
    const assessmentCfg: ActivityCfg = {
      id: activityId + "/assessment",
      definition: {
        name: {
          "en-US": activityId + "/assessment",
        },
      },
    };
    await this.setActivityLaunched(assessmentCfg);
  }


  /**
   * Sets the assessment as passed with the given score.
   * @param assessmentId The ID of the assessment.
   * @param score The score of the assessment.
   * @returns A Promise that resolves when the assessment is set as passed.
   */
  protected async setAssessmentPassed(
    assessmentId: string,
    score: number,
  ): Promise<void> {
    this.log("setAssessmentPassed");
    const assessmentCfg: ActivityCfg = {
      id: assessmentId,
      definition: {
        name: {
          "en-US": assessmentId,
        },
      },
    };
    const attemptsResponse = await this.tincan.getState(assessmentId + "/attempts");
    const attempts = attemptsResponse?.contents ? parseInt(attemptsResponse.contents) : 0;
    await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/passed",
        display: {
          "en-US": "passed",
        },
      },
      object: new Activity(assessmentCfg),
      result: {
        score: {
          raw: score ?? 1,
        },
        completion: true,
        success: true,
        duration: "PT1H",
        extensions: {
          "http://adlnet.gov/expapi/activities/attempt": attempts,
        },
        response: "The user passed the activity",
      },
    }));
    await this.tincan.setState(assessmentId, "passed");
    await this.tincan.setState(assessmentId + "/attempts", (attempts + 1).toString());
    await this.tincan.setState("random", ""); // Set another random state to ensure the last set state is not the progress
  }

  /**
   * Sets the assessment as failed and updates the score.
   * @param assessmentId - The ID of the assessment.
   * @param score - The score of the assessment.
   * @returns A Promise that resolves when the assessment is set as failed.
   */
  protected async setAssessmentFailed(
    assessmentId: string,
    score: number,
  ): Promise<void> {
    this.log("setAssessmentFailed");
    const assessmentCfg: ActivityCfg = {
      id: assessmentId,
      definition: {
        name: {
          "en-US": assessmentId,
        },
      },
    };
    const attemptsResponse = await this.tincan.getState(assessmentId + "/attempts");
    const attempts = attemptsResponse?.contents ? parseInt(attemptsResponse.contents) : 0;
    await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/failed",
        display: {
          "en-US": "failed",
        },
      },
      object: assessmentCfg,
      result: {
        score: {
          raw: score ?? 0,
        },
        success: false,
        completion: false,
        response: "The user failed the activity",
        extensions: {
          "http://adlnet.gov/expapi/activities/attempt": attempts,
        },
        duration: "PT1H",
      },
    }));
    await this.tincan.setState(assessmentId, "failed");
    await this.tincan.setState(assessmentId + "/attempts", (attempts + 1).toString());
    await this.tincan.setState("random", ""); // Set another random state to ensure the last set state is not the progress
  }


  /**
   * Sets the assessment as completed in the LMS.
   * Assessments are not "Completed" in the LMS, but "Passed" or "Failed".
   * So, we check the score and set the assessment as "Passed" if the score is greater than or equal to 0.8, or "Failed" otherwise.
   * @param completionVerb The verb indicating the completion status (default: "completed").
   */

  async setAssessmentCompleted(
    responses: IAssessmentResponse[],
    passScore: number,
    score: number,
  ): Promise<void> {
    this.log("setAssessmentCompleted");
    const activityId = this.tincan.activity?.id as string;
    const assessmentId = activityId + "/assessment";
    const responsesId = assessmentId + "/response";
    const scoreId = assessmentId + "/score";
    await this.tincan.setState(responsesId, JSON.stringify(responses));
    await this.tincan.setState(scoreId, score.toString());
    await this.tincan.setState("random", ""); // Set another random state to ensure the last set state is not the progress
    if (score >= passScore) {
      await this.setAssessmentPassed(assessmentId, score);
    } else {
      await this.setAssessmentFailed(assessmentId, score);
    }
  }

  // NOTEBOOKS
  /**
   * Checks the completion status of the notebook activity.
   * 
   * @param completionVerb The verb indicating the completion status (default: "completed").
   * @returns A Promise that resolves to a boolean indicating whether the notebook is completed.
   */
  async checkNotebookCompletion(completionVerb: string = "completed"): Promise<boolean> {
    this.log("Check Notebook Completion");
    const activityId = `${this.tincan.activity?.id}/notebook`;
    return await this.checkCompletion(activityId, completionVerb);
  }

  /**
   * Sets the notebook as launched.
   * @returns A Promise that resolves to void.
   */
  async setNotebookLaunched(): Promise<void> {
    this.log("setNotebookLaunched");
    const activityId = `${this.tincan.activity?.id}/notebook`;
    const activityCfg = {
      id: activityId,
      definition: {
        name: {
          "en-US": activityId,
        },
      },
    };
    await this.setActivityLaunched(activityCfg);
  }

  /**
   * Sets the notebook as completed.
   * 
   * @param completionVerb The verb to indicate completion (default: "completed").
   * @returns A Promise that resolves to void or a Response object.
   */
  async setNotebookCompleted(completionVerb: string = "completed"): Promise<void | Response> {
    this.log("setNotebookCompleted");
    const activityId = `${this.tincan.activity?.id}/notebook`
    // const activityCfg = {
    //   id: activityId,
    //   definition: {
    //     name: {
    //       "en-US": activityId,
    //     },
    //   },
    // };
    // await this.setActivityCompleted(activityCfg);
    return await this.setStateCompleted(activityId, "notebook", completionVerb);
  }

  // VIDEOS
  /**
   * Checks the completion status of a video activity.
   * @param completionVerb The completion verb to check against (default: "completed").
   * @returns A Promise that resolves to a boolean indicating the completion status.
   */
  async checkVideoCompletion(completionVerb: string = "completed"): Promise<boolean> {
    this.log("Check Video Completion");
    const activityId = `${this.tincan.activity?.id}/video`;
    return await this.checkCompletion(activityId, completionVerb);
  }

  /**
   * Sets the video as launched.
   * @returns A Promise that resolves to void.
   */
  async setVideoLaunched(): Promise<void> {
    this.log("setVideoLaunched");
    const activityId = `${this.tincan.activity?.id}/video`;
    const activityCfg = {
      id: activityId,
      definition: {
        name: {
          "en-US": activityId,
        },
      },
    };
    await this.setActivityLaunched(activityCfg);
  }

  /**
   * Retrieves the progress of the video.
   * @returns A Promise that resolves to a number representing the number of seconds watched.
   * If the progress is not available, the method will return 0.
   */
  async getVideoProgress(): Promise<number> {
    this.log("Check Video Progress");
    const activityId = `${this.tincan.activity?.id}/video-progress`;
    const getState = await this.tincan.getState(activityId);
    if (getState?.contents) {
      // Contents should be a stringified number denoting the number of seconds watched
      try {
        return parseFloat(getState.contents);
      } catch (e) {
        this.log("getVideoProgress: Error parsing the progress");
      }
    }
    return 0;
  }

  /**
   * Sets the progress of a video.
   * @param progress - The progress value to set (in seconds).
   * @returns A Promise that resolves to void or a Response object.
   */
  async setVideoProgress(
    progress: number,
  ): Promise<void | Response> {
    this.log("setVideoProgress");
    const activityId = `${this.tincan.activity?.id}/video-progress`;
    const progressResponse =  await this.tincan.setState(activityId, progress.toString());
    await this.tincan.setState("random", ""); // Set another random state to ensure the last set state is not the progress
    return progressResponse;
  }

  /**
   * Sets the video completion status.
   * 
   * @param completionVerb The completion verb to be used (default: "completed").
   * @returns A Promise that resolves to void or a Response object.
   */
  async setVideoCompleted(
    completionVerb: string = "completed",
  ): Promise<void | Response> {
    this.log("setVideoCompleted");
    const activityId = `${this.tincan.activity?.id}/video`;
    // const activityCfg = {
    //   id: activityId,
    //   definition: {
    //     name: {
    //       "en-US": activityId,
    //     },
    //   },
    // };
    // await this.setActivityCompleted(activityCfg);
    return await this.setStateCompleted(activityId, "video", completionVerb);
  }

  /**
   * Sets the run for a specific cell in the LMS.
   * Sends a statement to the LMS indicating that the cell has been experienced.
   * 
   * @param cellIdx - The index or identifier of the cell.
   * @param activity - The activity configuration for the cell.
   * @returns A promise that resolves when the statement is sent.
   */
  async setCellRun(
    cellIdx: number | string,
    activity?: ActivityCfg,
  ): Promise<void> {
    this.log("setCellRun");
    // Send a statement to the LMS
    await this.tincan.sendStatement(new Statement({
      actor: this.tincan.actor as Agent,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/experienced",
        display: {
          "en-US": "experienced",
        },
      },
      object: {
        id: `${activity ? activity.id : this.tincan.activity?.id}/cell/${cellIdx}`,
        definition: {
          name: {
            "en-US": `${activity ? activity.id : this.tincan.activity?.id}/cell/${cellIdx}`,
          },
        },
      },
    }));
  }
}