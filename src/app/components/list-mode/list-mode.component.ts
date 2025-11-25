import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListItem } from '../../interfaces/list-item.interface';

@Component({
  selector: 'app-list-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-mode.component.html',
  styleUrl: './list-mode.component.scss'
})
export class ListModeComponent {
  @Input() items: ListItem[] = [];

  onButtonClick(item: ListItem) {
    console.log('Button clicked for:', item.title);
  }
}

