import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { App } from './app';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    App
  ],
  exports: [App]
})
export class AppModule { }
