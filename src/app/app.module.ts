import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from './service/i18n.service';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { TreeModule } from 'ng2-tree';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CreateSpaceComponent } from './components/create-space/create-space.component';
import { CreateWorkspaceComponent } from './components/create-workspace/create-workspace.component';
import { ThemeButtonComponent } from './components/theme-button/theme-button.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    CreateSpaceComponent,
    CreateWorkspaceComponent,
    ThemeButtonComponent
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
    
  ],
  providers: [I18nService],
  bootstrap: [AppComponent]
})
export class AppModule { }
