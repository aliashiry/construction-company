import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListItem } from '../../interfaces';

@Component({
  selector: 'app-list-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-mode.component.html',
  styleUrls: ['./list-mode.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListModeComponent {
  @Input() items: ListItem[] = [];

  onButtonClick(item: ListItem) {
    console.log('Button clicked for:', item.title);
  }
}

