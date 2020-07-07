import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {Amcharts4Component} from './charts/amcharts4/amcharts4.component';
import {HighchartsComponent} from './charts/highcharts/highcharts.component';
import {CanvasjsComponent} from './charts/canvasjs/canvasjs.component';
import {Amcharts4CandlesticksComponent} from './charts/amcharts4-candlesticks/amcharts4-candlesticks.component';
import {Amcharts4StackedAreaComponent} from './charts/amcharts4-stacked-area/amcharts4-stacked-area.component';

const appRoutes: Routes = [
  // { path: 'amcharts3', component: Amcharts3Component },
  { path: 'amcharts4', component: Amcharts4Component },
  { path: 'highcharts', component: HighchartsComponent },
  { path: 'canvasJS', component: CanvasjsComponent },
  { path: 'amcharts4-candlestick', component: Amcharts4CandlesticksComponent },
  { path: 'amcharts4-stacked-area', component: Amcharts4StackedAreaComponent },
  { path: '',
    redirectTo: '/amcharts4',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes
    )
  ],
})
export class AppRoutingModule { }