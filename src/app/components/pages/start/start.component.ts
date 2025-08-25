import { Component, OnInit } from '@angular/core';
import { AuthService, User } from 'src/app/service/core/auth/Auth.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {
  public currentUser: User | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
  }

}
