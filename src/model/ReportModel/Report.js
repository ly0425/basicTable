import ReportRegion from './ReportRegion';
class Report {
  constructor() {
    this.ReportHeader = new ReportRegion('ReportHeader');
    this.ReportBody = new ReportRegion('ReportBody');
    this.ReportFooter = new ReportRegion('ReportFooter');
    this.dataSets = [];
  }
}
export default Report;
