import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/pages/login/login.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from './service/core/i18n/i18n.service';
import { HttpClientModule } from '@angular/common/http';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './components/pages/home/home.component';
import { HeaderComponent } from './components/core/header/header.component';
import { TreeModule } from 'ng2-tree';
import { SidebarComponent } from './components/core/sidebar/sidebar.component';
import { ThemeButtonComponent } from './components/core/theme-button/theme-button.component';
import { SpacesTreeComponent } from './components/core/spaces-tree/spaces-tree.component';
import { IconPickerComponent } from './components/shared/icon-picker/icon-picker.component';
import { LanguageButtonComponent } from './components/core/language-button/language-button.component';


// Angular Material imports
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { ColorPickerComponent } from './components/shared/color-picker/color-picker.component';
import { ModalFolderComponent } from './components/modals/modal-folder/modal-folder.component';
import { SplashScreenComponent } from './components/core/splash-screen/splash-screen.component';
import { StartComponent } from './components/pages/start/start.component';
import { InboxComponent } from './components/pages/inbox/inbox.component';
import { ListViewComponent } from './components/views/list-view/list-view.component';
import { ModalSpaceComponent } from './components/modals/modal-space/modal-space.component';
import { ModalWorkspaceComponent } from './components/modals/modal-workspace/modal-workspace.component';
import { ModalListComponent } from './components/modals/modal-list/modal-list.component';
import { CalendarViewComponent } from './components/views/calendar-view/calendar-view.component';
import { GantViewComponent } from './components/views/gant-view/gant-view.component';
import { TaskComponent } from './components/pages/task/task.component';
import { ModalInfoComponent } from './components/modals/modal-info/modal-info.component';
import { ModalDeleteComponent } from './components/modals/modal-delete/modal-delete.component';
import { ModalPersonComponent } from './components/modals/modal-person/modal-person.component';
import { TeamComponent } from './components/pages/team/team.component';
import { StatusTemplateComponent } from './components/pages/status-template/status-template.component';
import { TaskTemplateComponent } from './components/pages/task-template/task-template.component';

import { ModalStatusComponent } from './components/modals/modal-status/modal-status.component';
import { ModalTaskComponent } from './components/modals/modal-task/modal-task.component';

import { CalendarModule, DateAdapter } from 'angular-calendar';
import { GANTT_GLOBAL_CONFIG, NgxGanttModule } from '@worktile/gantt';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { es } from 'date-fns/locale';
import { WizardStatesComponent } from './components/Wizard/wizard-states/wizard-states.component';
import { WizardTaskComponent } from './components/Wizard/wizard-task/wizard-task.component';
import { ModalInfopersonComponent } from './components/modals/modal-infoperson/modal-infoperson.component';
import { ModalTemplateTaskComponent } from './components/modals/modal-template-task/modal-template-task.component';
import { BoardViewComponent } from './components/views/board-view/board-view.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ModalTemplateStatusDetailsComponent } from './components/modals/modal-template-status-details/modal-template-status-details.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    ThemeButtonComponent,
    SpacesTreeComponent,
    IconPickerComponent,
    LanguageButtonComponent,
    ColorPickerComponent,
    ModalFolderComponent,
    SplashScreenComponent,
    StartComponent,
    InboxComponent,
    ListViewComponent,
    ModalSpaceComponent,
    ModalWorkspaceComponent,
    ModalListComponent,
    CalendarViewComponent,
    GantViewComponent,
    TaskComponent,
    ModalInfoComponent,
    ModalDeleteComponent,
    TeamComponent,
    StatusTemplateComponent,
    TaskTemplateComponent,
    ModalPersonComponent,
    ModalStatusComponent,
    ModalTaskComponent,
    WizardStatesComponent,
    WizardTaskComponent,
    ModalInfopersonComponent,
    ModalTemplateTaskComponent,
    BoardViewComponent,
    ModalTemplateStatusDetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TreeModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    NgbModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatTabsModule,
    NgbDropdownModule,
  CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
  NgxGanttModule,
  DragDropModule,
  ],
  providers: [I18nService,
    {
      provide: GANTT_GLOBAL_CONFIG,
      useValue: {
        dateFormat: {
          yearQuarter: `QQQ 'de' yyyy`,
          month: 'LLLL',
          yearMonth: `LLLL yyyy'(semana' w ')'`,
          week: 'w',
          day: 'dd',
          year : 'yyyy',
        },
        locale: es 
      }
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
