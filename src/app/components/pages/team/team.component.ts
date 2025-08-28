import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamService } from '../../../service/features/team/team.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ModalDeleteComponent } from '../../modals/modal-delete/modal-delete.component';
import { ModalPersonComponent } from '../../modals/modal-person/modal-person.component';
// import { ModalWorkspaceComponent } from '../../modals/modal-workspace/modal-workspace.component';

type Team = {
  identificador?: string;
  nombres: string;
  apellidos?: string;
  correo?: string;
  celular?: string;
  valorHora?: number;
  estado: boolean;
  organizacionId?: number | string;
  clienteId?: number | string;
};

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {
  loading = false;
  errorMsg = '';
  successMsg = '';
  filter = '';
  isFormOpen = false;
  isEditing = false;

  // Data
  teams: Team[] = [];
  selected: Team | null = null;

  // Form
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private modalService: NgbModal,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      identificador: [null],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.maxLength(100)]],
      correo: ['', [Validators.email, Validators.maxLength(150)]],
      celular: ['', [Validators.maxLength(30)]],
      valorHora: [null, [Validators.min(0)]],
      estado: [true, []],
      organizacionId: [null],
      clienteId: [null],
    });
  }

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.teamService.listTeam().subscribe({
      next: (res) => {
        this.teams = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message ;
      },
    });
  }

  // Create
  startCreate(): void {
  this.openPersonModal();
  }

  // Edit
  startEdit(row: Team): void {
  this.openPersonModal(row);
  }

  cancelForm(): void {
    this.isFormOpen = false;
    this.form.reset();
    this.selected = null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    const payload: Team = this.form.value;

    if (this.isEditing) {
      // Ensure required ids for update remain
      const merged: Team = { ...this.selected, ...payload } as Team;
      this.teamService.UpdateWorkSpace(merged).subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'Persona actualizada.';
          this.isFormOpen = false;
          this.loadTeams();
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.message || 'No se pudo actualizar.';
        },
      });
  // removed immediate reload: wait for server response inside subscribe
    } else {
      this.teamService.CreateTeam(payload).subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'Persona creada.';
          this.isFormOpen = false;
          this.loadTeams();
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.message || 'No se pudo crear.';
        },
      });
  // removed immediate reload: wait for server response inside subscribe
    }
  }

  // Delete
  delete(row: Team): void {
    const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim();
    this.openDelete(
      this.translate.instant('Delete Person'),
      this.translate.instant('Are you sure you want to delete') + ` "${name}"?`
    ).then((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.teamService.DeleteWorkSpace(row).subscribe({
          next: () => {
            this.successMsg = 'Persona eliminada.';
            this.loadTeams();
          },
          error: (err) => {
            this.errorMsg = err?.error?.message || 'No se pudo eliminar.';
          },
          complete: () => {
            this.loading = false;
          },
        });
      }
    });
  }

  openCreateWorkspaceModal(team?: Team): void {
    // kept for backward compatibility but not used by default
  }

  openPersonModal(team?: Team): void {
    const modalRef = this.modalService.open(ModalPersonComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg',
    });

    modalRef.componentInstance.title = team ? this.translate.instant('Edit Person') : this.translate.instant('Create New Person');
    modalRef.componentInstance.isEditMode = !!team;
    modalRef.componentInstance.team = team || null;

    modalRef.result.then((teamData: Team) => {
      if (teamData) {
        if (team) this.updateTeam(teamData);
        else this.createTeam(teamData);
      }
    }).catch(() => {});
  }

  createTeam(team: Team): void {
    this.loading = true;
    this.teamService.CreateTeam(team).subscribe({
      next: () => {
        this.successMsg = 'Persona creada.';
        this.loadTeams();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'No se pudo crear.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  updateTeam(team: Team): void {
    this.loading = true;
    this.teamService.UpdateWorkSpace(team).subscribe({
      next: () => {
        this.successMsg = 'Persona actualizada.';
        this.loadTeams();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'No se pudo actualizar.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  openDelete(title: string, message: string): Promise<boolean> {
    const modalRef = this.modalService.open(ModalDeleteComponent, { centered: true, backdrop: 'static' });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.confirmLabel = 'Delete';
    modalRef.componentInstance.cancelLabel = 'Cancel';
    return modalRef.result.then(() => true).catch(() => false);
  }

  // Helpers
  get f() {
    return this.form.controls;
  }

  trackById(_i: number, item: Team) {
    return item.identificador || item.correo || _i;
  }

  get filteredTeams(): Team[] {
    const q = (this.filter || '').toLowerCase().trim();
    if (!q) return this.teams;
    return this.teams.filter((t) =>
      [t.nombres, t.apellidos, t.correo, t.celular, t.identificador]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }
}
