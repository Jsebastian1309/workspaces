import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ListService } from 'src/app/service/features/list/list.service';
import { TaskService } from 'src/app/service/features/task/Task.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalListComponent } from '../../modals/modal-list/modal-list.component';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss']
})
export class FolderComponent implements OnInit, OnChanges {
  @Input() folder: any;

  listsWithTasks: any[] = [];
  isLoading = false;
  currentView: 'list' | 'board' | 'gantt' | 'calendar' = 'list';

  constructor(
    private listService: ListService,
    private taskService: TaskService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    if (this.folder) {
      this.loadListsAndTasks();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['folder'] && changes['folder'].currentValue) {
      this.loadListsAndTasks();
    }
  }

  loadListsAndTasks() {
    if (!this.folder?.identificador) {
      this.listsWithTasks = [];
      return;
    }

    this.isLoading = true;
    this.listService.searchListsFiltered(this.folder.identificador).pipe(
      switchMap((lists: any[]) => {
        if (!lists || lists.length === 0) {
          return of([]);
        }
        const taskRequests = lists.map(list =>
          this.taskService.searchTasksFiltered({ lista_identificador: list.identificador }).pipe(
            catchError(() => of([])), // En caso de error, devuelve un array vacío de tareas
          )
        );
        return forkJoin(taskRequests).pipe(
          switchMap(tasksArray => {
            lists.forEach((list, index) => {
              list.tasks = tasksArray[index];
            });
            return of(lists);
          })
        );
      })
    ).subscribe({
      next: (result) => {
        this.listsWithTasks = result;
        this.isLoading = false;
        console.log('Lists with tasks loaded for folder:', this.folder.nombre, this.listsWithTasks);
      },
      error: (err) => {
        console.error('Error loading lists and tasks for folder:', err);
        this.isLoading = false;
      }
    });
  }

  setView(view: 'list' | 'board' | 'gantt' | 'calendar') {
    this.currentView = view;
  }

  getAllTasks(): any[] {
    return this.listsWithTasks.reduce((acc, list) => acc.concat(list.tasks || []), []);
  }

  addNewList() {
    const modalRef = this.modalService.open(ModalListComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.title = 'Create New List';
    modalRef.componentInstance.SelectedFolder = this.folder;

    modalRef.result.then((result) => {
      if (result) {
        this.loadListsAndTasks();
      }
    }).catch(() => {});
  }
}
