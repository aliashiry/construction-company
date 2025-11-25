import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListModeComponent } from '../../components/list-mode/list-mode.component';
import { ListItem } from '../../interfaces/list-item.interface';

@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [CommonModule, ListModeComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListPageComponent {
  items: ListItem[] = [
    {
      image: 'https://via.placeholder.com/100',
      title: 'Sample Item 1',
      description: 'This is a sample description for item 1.',
      buttonText: 'View'
    },
    {
      image: 'https://via.placeholder.com/100',
      title: 'Sample Item 2',
      description: 'This is a sample description for item 2.',
      buttonText: 'View'
    },
    {
      image: 'https://via.placeholder.com/100',
      title: 'Sample Item 3',
      description: 'This is a sample description for item 3.',
      buttonText: 'View'
    }
  ];
}

