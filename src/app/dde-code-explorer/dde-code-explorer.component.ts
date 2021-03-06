import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { DdeApiService } from '../services/dde-api.service';
import { DdeActionService } from '../services/dde-action.service';
import { Session } from '../../model/session';
import { CodeSnippet, CodeSnippetEnum } from '../../model/code-snippet';
import { CSVDataSource, ProtectedCSVDataSource, BikeShareWeatherCSVSource, BikeShareRidesDemographCSVSource } from '../../model/data-source';
import { CodeSnippetsRepoService } from '../services/code-snippets-repo.service';
import * as DashboardMode from '../../model/dashboard-mode';
import { AnalyticsService } from '../../instrumentation/analytics';
import * as instrumentation from '../../assets/resources/instrumentation.json';
import * as codeExplorer_resource from '../../assets/resources/codeExplorer.json';
import { APIAndDashboardTraits } from '../../interfaces/apiAndDashboardTraits';
import { DashboardInteractionTraits } from '../../interfaces/dashboardInteractionTraits';

@Component({
  selector: 'dde-code-explorer',
  templateUrl: './dde-code-explorer.component.html',
  styleUrls: ['./dde-code-explorer.component.css']
})
export class DdeCodeExplorerComponent implements OnInit {
  @Output() session: EventEmitter<Session> = new EventEmitter<Session>();
  @Output() apiId: EventEmitter<string> = new EventEmitter<string>();
  @Output() dashboardApi: EventEmitter<string> = new EventEmitter<string>();
  @Output() response: EventEmitter<string> = new EventEmitter<string>();
  @Input() codeSnippet : CodeSnippet;
  dataSources = [CSVDataSource, ProtectedCSVDataSource, BikeShareWeatherCSVSource, BikeShareRidesDemographCSVSource ];
  dashboardModes = [DashboardMode.EditMode, DashboardMode.ViewMode, DashboardMode.EditGroupMode];
  sampleModule : string;
  sessionObject = null;
  codeExplorer_resx = codeExplorer_resource;

  constructor(private ddeApiService: DdeApiService, private codeSnippetsRepoService: CodeSnippetsRepoService,
              private ddeActionService: DdeActionService, private analyticsService: AnalyticsService) { }

  ngOnInit() {
  }

  setExplorerDiv() {
      let classes =  {
          divsmall: this.codeSnippet && this.codeSnippet.size === 'small',
          divlarge: !this.codeSnippet || this.codeSnippet.size === 'large'
      };
      return classes;
  }

  async runCode() {
    let dataSource: string = '';
    let actionResource: string = '';

    try {
      this.ddeActionService.previousAction = this.ddeActionService.currentAction;
      this.ddeActionService.currentAction = this.codeSnippet.selection;

      if (this.codeSnippet.selection === CodeSnippetEnum.CreateSession) {
        actionResource = (<any>instrumentation).actions.createdSession;
        this.sessionObject = await this.ddeApiService.createNewSession();
        this.session.emit(this.sessionObject);
        this.resetAllRunButtons();
        this.analyticsService.setSession(this.sessionObject.id);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.CreateAPIFramework) {
        actionResource = (<any>instrumentation).actions.initializedSession;
        this.apiId.emit(await this.ddeApiService.createAndInitApiFramework());
        this.resetAllRunButtons();
        this.enableRunButton(CodeSnippetEnum.CreateDashboard);
        this.enableRunButton(CodeSnippetEnum.OpenDashboard);
        this.enableRunButton(CodeSnippetEnum.RegisterApiCallback);
        this.enableRunButton(CodeSnippetEnum.UnregisterApiCallback);
        this.enableRunButton(CodeSnippetEnum.CloseApiFramework);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.RegisterApiCallback) {
        actionResource = (<any>instrumentation).actions.registeredApiCallback;
        this.ddeApiService.registerApiCallback();
        this.response.emit((<any>instrumentation).actions.registeredApiCallback.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.UnregisterApiCallback) {
        actionResource = (<any>instrumentation).actions.unregisteredApiCallback;
        this.ddeApiService.unregisterApiCallback();
        this.response.emit((<any>instrumentation).actions.unregisteredApiCallback.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.CloseApiFramework) {
        actionResource = (<any>instrumentation).actions.closedAPIFramework;
        this.ddeApiService.closeApiFramework();
        this.response.emit((<any>instrumentation).actions.closedAPIFramework.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.CreateDashboard) {
        actionResource = (<any>instrumentation).actions.createdNew;
        this.dashboardApi.emit(await this.ddeApiService.createDashboard());
        this.enableDashboardInteractionRunButton();
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.OpenDashboard) {
        actionResource = (<any>instrumentation).actions.opened;
        this.dashboardApi.emit(await this.ddeApiService.openDashboard());
        this.enableDashboardInteractionRunButton();
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.AddCSVSource) {
        actionResource = (<any>instrumentation).actions.addSource;
        dataSource = await this.ddeApiService.addCSVSampleSource();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = true;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.AddProtectedCSVSource) {
        actionResource = (<any>instrumentation).actions.addSource;
        dataSource = await this.ddeApiService.addProtectedCSVSampleSource();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = true ;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.AddBikeShareRidesDemographCSVSource) {
        actionResource = (<any>instrumentation).actions.addSource;
        dataSource = await this.ddeApiService.addBikeShareRidesDemographCSVSampleSource();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = true;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.AddBikeShareWeatherCSVSource) {
        actionResource = (<any>instrumentation).actions.addSource;
        dataSource = await this.ddeApiService.addBikeShareWeatherCSVSampleSource();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = true;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.DashboardEditMode) {
        actionResource = (<any>instrumentation).actions.editMode;
        this.ddeApiService.setDashboardMode_Edit();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = false;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.DashboardViewMode) {
        actionResource = (<any>instrumentation).actions.viewMode;
        this.ddeApiService.setDashboardMode_View();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = false;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.DashboardEditGroupMode) {
        actionResource = (<any>instrumentation).actions.groupEditMode;
        this.ddeApiService.setDashboardMode_EditGroup();
        this.ddeActionService.isAddingDataSourceLastUpdateToDashboard = false;
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.UndoLastAction) {
        actionResource = (<any>instrumentation).actions.undo;
        this.ddeApiService.undoLastAction();
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.RedoLastAction) {
        actionResource = (<any>instrumentation).actions.redo;
        this.ddeApiService.redoLastAction();
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.TogglePropertiesPane) {
        actionResource = (<any>instrumentation).actions.toggleProperties;
        this.ddeApiService.togglePropertiesPane();
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.GetDashboardSpec) {
        actionResource = (<any>instrumentation).actions.getSpecs;
        await this.ddeApiService.getDashboardSpec();
        this.response.emit((<any>instrumentation).actions.getSpecs.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.UpdateModuleDefinitions) {
        actionResource = (<any>instrumentation).actions.updateDataDefinition;
        this.ddeApiService.updateModuleDefinitions();
        this.response.emit((<any>instrumentation).actions.updateDataDefinition.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.ClearDirtyState) {
        actionResource = (<any>instrumentation).actions.clearDirtyState;
        this.ddeApiService.clearDirtyState();
        this.response.emit((<any>instrumentation).actions.clearDirtyState.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.RegisterCallback) {
        actionResource = (<any>instrumentation).actions.registerDashboardCallback;
        this.ddeApiService.registerCallback();
        this.response.emit((<any>instrumentation).actions.registerDashboardCallback.message);
      }
      else if (this.codeSnippet.selection === CodeSnippetEnum.UnregisterCallback) {
        actionResource = (<any>instrumentation).actions.unregisterDashboardCallback;
        this.ddeApiService.unregisterCallback();
        this.response.emit((<any>instrumentation).actions.unregisterDashboardCallback.message);
      }
      else {
        throw new Error((<any>instrumentation).invalidCodeSnippet);
      }

      this.createTraits((<any>actionResource).processType, (<any>actionResource).name, true, dataSource, (<any>actionResource).message);
      this.ddeActionService.hasActionChanged.next(true); ;
    }
    catch(e) {
      console.log(e);
      this.session.emit(null);
      this.apiId.emit('');
      this.createTraits((<any>actionResource).processType, (<any>actionResource).name, false, dataSource, e.message);
    }
  }

  enableDashboardInteractionRunButton() {
    this.enableRunButton(CodeSnippetEnum.AddCSVSource);
    this.enableRunButton(CodeSnippetEnum.AddProtectedCSVSource);
    this.enableRunButton(CodeSnippetEnum.AddBikeShareRidesDemographCSVSource);
    this.enableRunButton(CodeSnippetEnum.AddBikeShareWeatherCSVSource);
    this.enableRunButton(CodeSnippetEnum.DashboardEditMode);
    this.enableRunButton(CodeSnippetEnum.DashboardViewMode);
    this.enableRunButton(CodeSnippetEnum.DashboardEditGroupMode);
    this.enableRunButton(CodeSnippetEnum.UndoLastAction);
    this.enableRunButton(CodeSnippetEnum.RedoLastAction);
    this.enableRunButton(CodeSnippetEnum.TogglePropertiesPane);
    this.enableRunButton(CodeSnippetEnum.GetDashboardSpec);
    this.enableRunButton(CodeSnippetEnum.ClearDirtyState);
    this.enableRunButton(CodeSnippetEnum.UpdateModuleDefinitions);
    this.enableRunButton(CodeSnippetEnum.RegisterCallback);
    this.enableRunButton(CodeSnippetEnum.UnregisterCallback);
  }

  createTraits(processType: string, process: string, isSuccess: boolean, dataSource: string, resultValue: string) {
    let result = isSuccess ? 'success' : 'error';
    let traits : APIAndDashboardTraits | DashboardInteractionTraits;

    switch(this.codeSnippet.selection) {
      case CodeSnippetEnum.CreateSession:
      case CodeSnippetEnum.CreateAPIFramework:
      case CodeSnippetEnum.OpenDashboard:
      case CodeSnippetEnum.CreateDashboard:
      case CodeSnippetEnum.ClearDirtyState:
      case CodeSnippetEnum.RegisterCallback:
      case CodeSnippetEnum.UnregisterCallback:
      case CodeSnippetEnum.RegisterApiCallback:
      case CodeSnippetEnum.UnregisterApiCallback:
      case CodeSnippetEnum.CloseApiFramework: {
        traits = {processType: processType, process: process, sessionId: this.analyticsService.sessionId, successFlag: result,
                  resultValue: resultValue, productTitle: (<any>instrumentation).productTitle, /*version: environment.version*/};

        break;
      }
      case CodeSnippetEnum.UndoLastAction:
      case CodeSnippetEnum.RedoLastAction:
      case CodeSnippetEnum.TogglePropertiesPane:
      case CodeSnippetEnum.DashboardEditMode:
      case CodeSnippetEnum.DashboardViewMode:
      case CodeSnippetEnum.DashboardEditGroupMode: {
        traits = {processType: processType, process: process, sessionId: this.analyticsService.sessionId, successFlag: result,
                  resultValue: resultValue, productTitle: (<any>instrumentation).productTitle, /*version: environment.version,*/ uiElement: (<any>instrumentation).runButton };
        break;
      }
      case CodeSnippetEnum.AddCSVSource:
      case CodeSnippetEnum.AddProtectedCSVSource:
      case CodeSnippetEnum.AddBikeShareRidesDemographCSVSource:
      case CodeSnippetEnum.AddBikeShareWeatherCSVSource:
      case CodeSnippetEnum.AddBikeShareRidesDemographCSVSource:
      case CodeSnippetEnum.AddBikeShareWeatherCSVSource:
      case CodeSnippetEnum.GetDashboardSpec: {
        traits = {processType: processType, process: process, sessionId: this.analyticsService.sessionId, successFlag: result,
                  resultValue: resultValue, productTitle: (<any>instrumentation).productTitle, /*version: environment.version,*/ customName1: 'dataSource',
                  customValue1: dataSource, uiElement: (<any>instrumentation).runButton};
        break;
      }
    }

    this.analyticsService.sendTrack((<any>instrumentation).ranProcessTrack, traits);
  }

  enableRunButton(type: CodeSnippetEnum) {
    let snippet = this.codeSnippetsRepoService.getSnippet(type);
    snippet.disableRun = false;
    this.codeSnippetsRepoService.setSnippet(type, snippet);
  }

  resetAllRunButtons() {
    this.codeSnippetsRepoService.disableRunButton();
    this.enableRunButton(CodeSnippetEnum.CreateAPIFramework);
  }

  onSelect(sourceValue) {
    for (var i = 0; i < this.dataSources.length; i++) {
      if (this.dataSources[i].value === sourceValue) {
        this.codeSnippet = this.codeSnippetsRepoService.getSnippet(sourceValue);
      }
    }
  }

  onSelectMode(modeValue) {
    for (var i = 0; i < this.dashboardModes.length; i++) {
      if (this.dashboardModes[i].value === modeValue) {
        this.codeSnippet = this.codeSnippetsRepoService.getSnippet(modeValue);
      }
    }
  }

  showSessionPanel() {
    return this.codeSnippet && (this.codeSnippet.selection === CodeSnippetEnum.CreateAPIFramework);
  }

  showSourcesDropDown() {
    return this.codeSnippet && (this.codeSnippet.selection === CodeSnippetEnum.AddCSVSource ||
          this.codeSnippet.selection === CodeSnippetEnum.AddProtectedCSVSource ||
          this.codeSnippet.selection === CodeSnippetEnum.AddBikeShareWeatherCSVSource ||
          this.codeSnippet.selection === CodeSnippetEnum.AddBikeShareRidesDemographCSVSource);
  }

  showDashboardModesDropDown() {
    return this.codeSnippet && (this.codeSnippet.selection === CodeSnippetEnum.DashboardViewMode ||
          this.codeSnippet.selection === CodeSnippetEnum.DashboardEditMode ||
          this.codeSnippet.selection === CodeSnippetEnum.DashboardEditGroupMode);
  }
}
