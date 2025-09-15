import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/service/features/task/Task.service';

@Component({
  selector: 'app-board-view',
  templateUrl: './board-view.component.html',
  styleUrls: ['./board-view.component.scss']
})
export class BoardViewComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  @Input() statuses: { key: string; label: string; color: string }[] = [];
  @Input() teams: { identificador: string; nombres: string }[] = [];
  @Output() refresh = new EventEmitter<void>();

  grouped: Record<string, Task[]> = {};
  listIds: string[] = [];
  collapsed: Record<string, boolean> = {};

  constructor(private taskService: TaskService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] || changes['statuses']) {
      this.buildBoard();
    }
  }

  private buildBoard() {
    const order = (this.statuses || []).map(s => String(s.key || '').toUpperCase());
    const map: Record<string, Task[]> = {};
    (this.tasks || []).forEach(t => {
      const k = (t as any)?.estado || 'OPEN';
      const key = String(k).toUpperCase();
      (map[key] ||= []).push(t);
    });
    // Only keep statuses that actually have tasks
    const present = Object.keys(map).filter(k => (map[k]?.length || 0) > 0);
    // Order columns according to statuses order, then any unknown keys
    const ordered = [
      ...order.filter(k => present.includes(k)),
      ...present.filter(k => !order.includes(k))
    ];
    this.grouped = map;
    this.listIds = ordered;
    // Ensure collapsed map has keys
    ordered.forEach(k => { if (this.collapsed[k] === undefined) this.collapsed[k] = false; });
  }

  getStatusLabel(key: string): string {
    const norm = String(key || '').toUpperCase();
    return (this.statuses || []).find(s => String(s.key || '').toUpperCase() === norm)?.label || key;
  }

  getStatusColor(key: string): string {
    const norm = String(key || '').toUpperCase();
    return (this.statuses || []).find(s => String(s.key || '').toUpperCase() === norm)?.color || '#e9ecef';
  }

  assigneeLabel(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') {
      const found = (this.teams || []).find(t => t.identificador === val);
      return found?.nombres || val;
    }
    return (val?.nombres || val?.nombre || '').toString();
  }

  drop(event: CdkDragDrop<Task[]>, targetKey: string) {
    const prev = event.previousContainer;
    const curr = event.container;
    if (prev === curr) {
      moveItemInArray(curr.data, event.previousIndex, event.currentIndex);
      return;
    }
    // Move between columns
    transferArrayItem(prev.data, curr.data, event.previousIndex, event.currentIndex);
    const moved: Task = curr.data[event.currentIndex];
    const originalStatus = moved.estado;
    moved.estado = targetKey; // optimistic
    this.taskService.actualizarTarea(moved).subscribe({
      next: () => {
        // Optionally refresh to sync
        this.refresh.emit();
      },
      error: () => {
        // revert on error
        moved.estado = originalStatus;
        transferArrayItem(curr.data, prev.data, event.currentIndex, event.previousIndex);
      }
    });
  }

  isCollapsed(key: string): boolean {
    return !!this.collapsed[String(key).toUpperCase()];
  }

  toggleColumn(key: string) {
    const norm = String(key).toUpperCase();
    this.collapsed[norm] = !this.collapsed[norm];
  }
}
