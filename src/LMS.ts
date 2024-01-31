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

export class LMS {
  tincan: TinCan;

  log(message: string): void {
    Logger.log(message, "LMS");
  }

  constructor() {
    this.log("constructor");
    this.tincan = new TinCan({ url: window.location.href });
  }

  async checkLessonCompletion(
    completionVerb: string = "completed",
    completionStatus = "true"
  ): Promise<boolean> {
    this.log("checkCompletion");
    const getState = await this.tincan.getState(completionVerb);
    if (getState?.contents) {
      return getState.contents === completionStatus;
    }
    return false;
  }

  async checkTaskCompletion(
    taskId: string,
    completionVerb: string = "completed",
    completionStatus = "true"
  ): Promise<boolean> {
    this.log("checkCompletion");
    const getState = await this.tincan.getState(taskId);
    if (getState?.contents) {
      const stateResult = JSON.parse(getState.contents) as { [key: string]: string };
      return stateResult[completionVerb] === completionStatus;
    }
    return false;
  }

  /**
   * Send a statement to the LMS to record that the user has completed a lesson or task.
   * If no id is provided, the current activity will be used.
   * @param activity The activity that the user has completed. If no activity is provided, the current activity will be used.
   * The provided activity must be an object with two properties: id and definition.
   **/
  async setActivityCompleted(
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
   * Send a state to the LMS to record that the user has completed a task or lesson
   * @param activityId The id of the activity that the user has completed.
   * @param completionVerb The verb to use to record the completion. Defaults to "completed".
   * @param completionStatus The state to use to record the completion. Defaults to "true".
   * If the activityId is provided, the state will be stored as an object with the activityId as the key and the {completionVerb: completionStatus} as the value.
   **/
  async setStateCompleted(
    activityId?: string,
    completionVerb = "completed",
    completionStatus = "true"
  ): Promise<void> {
    this.log("setStateCompletion");
    // Send a statement to the LMS
    const valueState = activityId ? JSON.stringify({ [completionVerb]: completionStatus }) : completionStatus;
    const keyState = activityId ?? completionVerb;
    await this.tincan.setState(keyState, valueState);
  }

  async setLessonCompleted(
    completionVerb: string = "completed",
    completionStateus = "true"
  ): Promise<void> {
    this.log("setCompletion");
    // Send a statement to the LMS
    await this.setActivityCompleted();
    await this.setStateCompleted(
      undefined,
      completionVerb,
      completionStateus
    );
  }

  async setTaskCompleted(
    taskId: string,
    taskName: string,
    taskDescription?: string,
    completionVerb: string = "completed",
    completionStatus = "true"
  ): Promise<void> {
    this.log("setCompletion");
    // Send a statement to the LMS
    const activityCfg = {
      id: taskId,
      definition: {
        name: { "en-US": taskName },
        description: taskDescription ? { "en-US": taskDescription } : undefined,
      }
    };
    await this.setActivityCompleted(activityCfg);
    await this.setStateCompleted(
      taskId,
      completionVerb,
      completionStatus
    );
  }
}