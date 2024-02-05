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

  async checkTaskCompletion(
    taskId: string,
    completionVerb: string = "completed",
  ): Promise<boolean> {
    this.log("checkCompletion");
    const getState = await this.tincan.getState(taskId);
    console.log(getState);
    if (getState?.contents) {
      const stateResult = JSON.parse(getState.contents) as { [key: string]: string };
      return taskId in stateResult && stateResult[taskId] === completionVerb;
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
    activityId: string,
    activityType: "lesson" | "task" = "lesson",
    completionVerb = "completed",
  ): Promise<void | Response> {
    this.log("setStateCompletion");
    // Send a statement to the LMS
    if (activityType === "task") {
      let currentState;
      try {
        currentState = await this.tincan.getState(completionVerb);
      } catch (error) {
        this.log("Error getting state");
      }
      if (currentState?.contents) {
        const stateResult = JSON.parse(currentState.contents) as { [key: string]: string };
        // Add the current activity to the state
        stateResult[activityId] = completionVerb;
        const response = await this.tincan.setState(activityId, JSON.stringify(stateResult));
        return response;
      } else {
        const response = await this.tincan.setState(activityId, JSON.stringify({ [activityId]: completionVerb }));
        return response;
      }
    } else if (activityType === "lesson") {
      const response = await this.tincan.setState(activityId, completionVerb);
      return response;
    } else {
      throw new Error("Invalid activityType");
    }
  }

  async setActivityLaunched(): Promise<void> {
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
      object: this.tincan.activity as Activity,
    }));
  }

  async setActivityExperienced(): Promise<void> {
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
      object: this.tincan.activity as Activity,
    }));
  }

  async setCellRun(
    cellIdx: number | string,
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
        id: `${this.tincan.activity?.id}-cell-${cellIdx}`,
        definition: {
          name: {
            "en-US": `${this.tincan.activity?.id}-cell-${cellIdx}`,
          },
        },
      },
    }));
  }

  async setLessonCompleted(
    completionVerb: string = "completed",
  ): Promise<void> {
    this.log("setCompletion");
    // Send a statement to the LMS
    await this.setActivityCompleted();
    const lessonId = this.tincan.activity?.id as string;
    await this.setStateCompleted(lessonId, "lesson", completionVerb);
  }

  async setTaskCompleted(
    taskId: string,
    taskName: string,
    taskDescription?: string,
    completionVerb: string = "completed",
  ): Promise<void | Response> {
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
    const stateResponse = await this.setStateCompleted(taskId, "task", completionVerb);
    return stateResponse;
  }
}