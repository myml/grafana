import { SelectableValue } from '@grafana/data';
import { CloudWatchDatasource } from './datasource';
import { VariableQuery, VariableQueryType } from './types';

export default class MetricFindQuery {
  constructor(private datasource: CloudWatchDatasource) {}

  async execute(query: VariableQuery) {
    try {
      if (!query.selectedRegion) {
        query.selectedRegion = this.datasource.getActualRegion();
      }
      // if (!query.selectedNamespace) {
      //   query.selectedNamespace = this.datasource.
      // }
      switch (query.selectedQueryType) {
        case VariableQueryType.Regions:
          return this.handleRegionsQuery();
        case VariableQueryType.Namespaces:
          return this.handleNamespacesQuery();
        case VariableQueryType.Metrics:
          return this.handleMetricsQuery(query);
        case VariableQueryType.DimensionKeys:
          return this.handleDimensionKeysQuery(query);
        case VariableQueryType.DimensionValues:
          return this.handleDimensionValuesQuery(query);
        case VariableQueryType.EBSVolumeIDs:
          return this.handleEbsVolumeIdsQuery(query);
        case VariableQueryType.EC2InstanceAttributes:
          return this.handleEc2InstanceAttributeQuery(query);
        case VariableQueryType.ResourceArns:
          return this.handleResourceARNsQuery(query);
        case VariableQueryType.Statistics:
          return this.handleStatisticsQuery();
        default:
          return [];
      }
    } catch (error) {
      console.error(`Could not run CloudWatchMetricFindQuery ${query}`, error);
      return [];
    }
  }

  async handleRegionsQuery() {
    const regions = await this.datasource.getRegions();
    return (regions as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleNamespacesQuery() {
    const namespaces = await this.datasource.getNamespaces();
    return (namespaces as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleMetricsQuery({ selectedNamespace, selectedRegion }: VariableQuery) {
    const metrics = await this.datasource.getMetrics(selectedNamespace, selectedRegion);
    return (metrics as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleDimensionKeysQuery({ selectedNamespace, selectedRegion }: VariableQuery) {
    const keys = await this.datasource.getDimensionKeys(selectedNamespace, selectedRegion);
    return (keys as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleDimensionValuesQuery({
    selectedNamespace,
    selectedRegion,
    selectedDimensionKey,
    selectedMetric,
    filters,
  }: VariableQuery) {
    var filterJson = {};
    if (filters) {
      filterJson = JSON.parse(filters);
    }
    const keys = await this.datasource.getDimensionValues(
      selectedRegion,
      selectedNamespace,
      selectedMetric,
      selectedDimensionKey,
      filterJson
    );
    return (keys as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleEbsVolumeIdsQuery({ selectedRegion, instanceID }: VariableQuery) {
    if (!instanceID) {
      return [];
    }
    const ids = await this.datasource.getEbsVolumeIds(selectedRegion, instanceID);
    return (ids as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleEc2InstanceAttributeQuery({ selectedRegion, attributeName, filters }: VariableQuery) {
    if (!attributeName) {
      return [];
    }
    var filterJson = {};
    if (filters) {
      filterJson = JSON.parse(filters);
    }
    const values = await this.datasource.getEc2InstanceAttribute(selectedRegion, attributeName, filterJson);
    return (values as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleResourceARNsQuery({ selectedRegion, resourceType, tags }: VariableQuery) {
    if (!resourceType) {
      return [];
    }
    var tagJson = {};
    if (tags) {
      tagJson = JSON.parse(tags);
    }
    const keys = await this.datasource.getResourceARNs(selectedRegion, resourceType, tagJson);
    return (keys as SelectableValue<string>).map((s: { label: string; value: string }) => ({
      text: s.label,
      value: s.value,
      expandable: true,
    }));
  }
  async handleStatisticsQuery() {
    return this.datasource.standardStatistics.map((s: string) => ({
      text: s,
      value: s,
      expandable: true,
    }));
  }
}
