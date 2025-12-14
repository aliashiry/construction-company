import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListItem } from '../../../core/models/list-item.interface';

@Component({
  selector: 'app-list-page',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush
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

