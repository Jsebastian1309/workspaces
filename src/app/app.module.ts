import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from './service/i18n.service';
import { HttpClientModule } from '@angular/common/http';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { TreeModule } from 'ng2-tree';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CreateSpaceComponent } from './components/create-space/create-space.component';
import { CreateWorkspaceComponent } from './components/create-workspace/create-workspace.component';
import { ThemeButtonComponent } from './components/theme-button/theme-button.component';
import { SpacesTreeComponent } from './components/spaces-tree/spaces-tree.component';
import { IconPickerComponent } from './components/icon-picker/icon-picker.component';
import { LanguageButtonComponent } from './components/language-button/language-button.component';


// Angular Material imports
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { ColorPickerComponent } from './components/color-picker/color-picker.component';
import { CreateFolderComponent } from './components/create-folder/create-folder.component';
import { CreateListComponent } from './components/create-list/create-list.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { StartComponent } from './components/start/start.component';
import { InboxComponent } from './components/inbox/inbox.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    CreateSpaceComponent,
    CreateWorkspaceComponent,
    ThemeButtonComponent,
    SpacesTreeComponent,
    IconPickerComponent,
    LanguageButtonComponent,
    ColorPickerComponent,
    CreateFolderComponent,
    CreateListComponent,
    SplashScreenComponent,
    StartComponent,
    InboxComponent
  ],
  imports: [
    BrowserModule,
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
  ],
  providers: [I18nService],
  bootstrap: [AppComponent]
})
export class AppModule { }
