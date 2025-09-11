import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { User } from 'src/app/service/core/auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalInfopersonComponent } from '../../modals/modal-infoperson/modal-infoperson.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public currentUser: User | null = null;


  constructor(
    private authService: AuthService,
    private modalService: NgbModal, 
    private translate: TranslateService,
    private router: Router
  ) { }
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
  }

  //modal Profile
  onProfile() {
    const modalRef = this.modalService.open(ModalInfopersonComponent, { size: 'lg' });
    modalRef.componentInstance.title = this.translate.instant('Profile Information');
    console.log('Current User in Header:', this.currentUser);
    modalRef.componentInstance.currentUser = this.currentUser;

  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
