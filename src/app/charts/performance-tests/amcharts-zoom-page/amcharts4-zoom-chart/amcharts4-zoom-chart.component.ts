import {AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ChartSettings} from '../../../../services/default-chart-settings';
import {ChartDataService} from '../../../../services/chart-data.service';
import * as am4charts from '@amcharts/amcharts4/charts';
import {applicationsSeriesNames} from '../../../../shared/applications-series-names';
import * as am4core from '@amcharts/amcharts4/core';
import {Amcharts4ZoomChartDataGenerator} from './amcharts4-zoom-chart-data-generator';
import {rgbColorsHighOpacity} from '../../../../shared/shared-chart-settings';

@Component({
  selector: 'app-amcharts4-zoom-chart',
  templateUrl: './amcharts4-zoom-chart.component.html',
  styleUrls: ['./amcharts4-zoom-chart.component.css']
})
export class Amcharts4ZoomChartComponent implements AfterViewInit, OnDestroy {

  constructor(private zone: NgZone, private cdRef: ChangeDetectorRef, private _dataService: Amcharts4ZoomChartDataGenerator, private chartDataService: ChartDataService) {
    this.chartData = this._dataService.getStaticOptimizedDataset();
    console.log('this.chartData111111: ', this.chartData);
  }
  static dataMode = 'average';
  public chartData: any;
  private chart: am4charts.XYChart;
  private colors = rgbColorsHighOpacity;
  public renderTimeResult = '';
  public result = 0;
  public applicationsSeriesNames = applicationsSeriesNames;
  scrollbarX: any;

  public ngAfterViewInit(): void {
    if (this.chartData) {
      am4core.options.queue = true;
      console.log('this.chartData: ', this.chartData);
      this.renderChart(ChartSettings.DEFAULT_SERIES_COUNT);
    }
  }

  toggleSeries(id: string) {
    // toggle main series
    if (Amcharts4ZoomChartComponent.dataMode === 'average') {
      this.chart.series.each(s => {
        if (s.id === id + '__average') {
          console.log('this.chart.scrollbarX11111: ', s);
          s.hidden ? s.show() : s.hide();
        }
      });
    } else if (Amcharts4ZoomChartComponent.dataMode === 'raw') {
      this.chart.series.each(s => {
        if (s.id === id) {
          console.log('this.chart.scrollbarX11111: ', s);
          s.hidden ? s.show() : s.hide();
        }
      });
    }

    // toggle scrollbar series
    this.scrollbarX.scrollbarChart.series.each(s => {
      if (s.dataFields.valueY === id + '__average') {
        console.log('s.id' , s.dataFields.valueY);
        s.isHidden ? s.show() : s.hide();
      }
    });
  }

  public renderChart(seriesCount: number): void {
    this.zone.runOutsideAngular(() => {
      this.chart = am4core.create('container-zoom', am4charts.XYChart);
      this.chart.data = this.chartData;

      // this.chart.events.on("zoomed", this.onZoomEvent);

      const startRenderTime = new Date();
      this.chart.events.on('ready', () => {
        const endRenderTime = new Date();
        this.result = endRenderTime.getTime() - startRenderTime.getTime();
        this.renderTimeResult = `${new Date(this.result).getSeconds()} seconds, ${new Date(this.result).getMilliseconds()} milliseconds`;
        this.cdRef.detectChanges();
      });

      this.chart.paddingRight = 20;
      this.chart.cursor = new am4charts.XYCursor();
      this.chart.dateFormatter.dateFormat = 'h:m:s';
      this.createValueAxis();
      this.createDateAxis();

      this.scrollbarX = new am4charts.XYChartScrollbar();
      const allSeriesArray = [];
      const averageSeriesArray = [];
      const merged = [].concat.apply([], this.applicationsSeriesNames);
      for (let i = 1; i <= merged.length - 1; i++) {
        const series = this.createSeries(merged[i], i);
        const averageSeries = this.createAverageSeries(merged[i], i);
        allSeriesArray.push(series);
        averageSeriesArray.push(averageSeries);
        this.chart.series.push(series);
        this.chart.series.push(averageSeries);

        if (i === merged.length - 1) {
          averageSeriesArray.forEach(s => this.scrollbarX.series.push(s));
          this.chart.scrollbarX = this.scrollbarX;
          this.customizeGrip(this.chart.scrollbarX.startGrip);
          this.customizeGrip(this.chart.scrollbarX.endGrip);
        }
      }
      console.log('this.chart.series: ', this.chart.series);
    });
  }

  private createValueAxis(): void {
    const valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.tooltip.disabled = true;
    valueAxis.renderer.minWidth = 35;
  }

  private createDateAxis(): void {
    const dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.grid.template.location = 0;
    dateAxis.renderer.minGridDistance = 80;
    dateAxis.events.on('selectionextremeschanged', this.dateAxisChanged);


  }

  dateAxisChanged (e) {
    const start = e.target.minZoomed;
    const end = e.target.maxZoomed;

    console.log(' e.target: ',  e);
    const updatedData = e.target.chart.data.filter(cd => { if (cd.timestamp > start && cd.timestamp < end) { return cd; }} );

      let pointsCount = 0;
      updatedData.forEach(measurementsData => {
          // minus one because we dont need to count timespan
          pointsCount = pointsCount + Object.keys(measurementsData).length - 1;

          if (pointsCount > 500) {
            Amcharts4ZoomChartComponent.dataMode = 'average';

            const currentActiveSeries = e.target.chart.series.values.filter(s => s.isHidden === false);

            currentActiveSeries.forEach(cas => {
              e.target.chart.series.values.forEach(s => {
                if (cas.id + '__average' === s.id) {
                  s.show();
                  cas.hide();
                }
              });
            });
            return;
          } else {
            Amcharts4ZoomChartComponent.dataMode = 'raw';
            // show raw data series
            const currentActiveSeries = e.target.chart.series.values.filter(s => s.isHidden === false);

            currentActiveSeries.forEach(cas => {
              e.target.chart.series.values.forEach(s => {
                if (cas.id === s.id + '__average') {
                  s.show();
                  cas.hide();
                }
              });
            });
          }
      });
      console.log(' e.target.pointsCount: ', pointsCount);
  }

  // Style scrollbar
  private customizeGrip(grip) {
    // Remove default grip image
    grip.icon.disabled = true;

    // Disable background
    grip.background.disabled = true;

    // Add rotated rectangle as bi-di arrow
    const img = grip.createChild(am4core.Rectangle);
    img.width = 15;
    img.height = 15;
    img.fill = am4core.color('#999');
    img.rotation = 45;
    img.align = 'center';
    img.valign = 'middle';

    // Add vertical bar
    const line = grip.createChild(am4core.Rectangle);
    line.height = 60;
    line.width = 3;
    line.fill = am4core.color('#999');
    line.align = 'center';
    line.valign = 'middle';

  }

  private createAverageSeries(serieInfo: {id: string, name: string}, index: number): any {
    const series = new am4charts.LineSeries();
    series.id = serieInfo.id + '__average';
    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = `${serieInfo.id}__average`;
    series.stroke = am4core.color(`${this.colors[index]}`);
    series.hidden = true;
    return series;
  }

  private createSeries(serieInfo: {id: string, name: string}, index: number): any {
    const series = new am4charts.LineSeries();

    series.id = serieInfo.id;
    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = `${serieInfo.id}`;
    series.strokeOpacity = 0;

    const bullet = series.bullets.push(new am4charts.Bullet());
    const roundBullet = bullet.createChild(am4core.Circle);
    bullet.fill = am4core.color(`${this.colors[index]}`);
    roundBullet.width = 10;
    roundBullet.height = 10;
    roundBullet.strokeWidth = 0;
    series.tooltipText = '{valueY.value}';

    series.hidden = true;
    return series;
  }

  public ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }

}
