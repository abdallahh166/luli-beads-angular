import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Component for displaying about page

interface Value {
  iconPath: string;
  title: string;
  description: string;
}

interface TimelineItem {
  year: string;
  event: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  values: Value[] = [
    {
      iconPath: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      title: 'Handcrafted with Love',
      description: 'Every bead is carefully selected and placed by hand, ensuring each bag is unique and made with passion.'
    },
    {
      iconPath: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
      title: 'Premium Quality',
      description: 'We use only the finest materials - from lustrous beads to durable threads and elegant hardware.'
    },
    {
      iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
      title: 'Personal Touch',
      description: 'Each bag can be personalized with custom embroidery, making it truly yours or a perfect gift.'
    },
    {
      iconPath: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      title: 'Artisan Excellence',
      description: 'Our skilled artisans bring decades of experience to create bags that are both beautiful and durable.'
    }
  ];

  timeline: TimelineItem[] = [
    { year: '2020', event: 'Founded Luli Beads with a passion for handcrafted accessories' },
    { year: '2021', event: 'Launched our first collection on Instagram, gaining 10K followers' },
    { year: '2022', event: 'Introduced custom embroidery services' },
    { year: '2023', event: 'Expanded to offer international shipping' },
    { year: '2024', event: 'Launched our e-commerce platform for seamless shopping' }
  ];
}
