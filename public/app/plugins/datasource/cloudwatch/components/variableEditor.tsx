import React, { PureComponent } from 'react';

import { QueryEditorProps } from '@grafana/data';
import { VariableQueryField, VariableTextField } from '.';
import { CloudWatchDatasource } from '../datasource';
import { CloudWatchJsonData, CloudWatchQuery, VariableQuery, VariableQueryData, VariableQueryType } from '../types';
import { getTemplateSrv } from '@grafana/runtime';

export type Props = QueryEditorProps<CloudWatchDatasource, CloudWatchQuery, CloudWatchJsonData, VariableQuery>;

export class VariableQueryEditor extends PureComponent<Props, VariableQueryData> {
  queryTypes: Array<{ value: string; label: string }> = [
    { value: VariableQueryType.Regions, label: 'Regions' },
    { value: VariableQueryType.Namespaces, label: 'Namespaces' },
    { value: VariableQueryType.Metrics, label: 'Metrics' },
    { value: VariableQueryType.DimensionKeys, label: 'Dimension Keys' },
    { value: VariableQueryType.DimensionValues, label: 'Dimension Values' },
    { value: VariableQueryType.EBSVolumeIDs, label: 'EBS Volume IDs' },
    { value: VariableQueryType.EC2InstanceAttributes, label: 'EC2 Instance Attributes' },
    { value: VariableQueryType.ResourceArns, label: 'Resource ARNs' },
    { value: VariableQueryType.Statistics, label: 'Statistics' },
  ];

  defaults: VariableQueryData = {
    selectedQueryType: this.queryTypes[0].value,
    selectedNamespace: '',
    selectedRegion: '',
    selectedMetric: '',
    selectedDimensionKey: '',
    filters: '',
    instanceID: '',
    attributeName: '',
    resourceType: '',
    tags: '',
    namespaces: [],
    regions: [],
    metrics: [],
    dimensionKeys: [],
    loading: true,
  };

  constructor(props: Props) {
    super(props);
    this.state = Object.assign(this.defaults, this.props.query);
  }

  async componentDidMount() {
    const regions = await this.props.datasource.getRegions();
    const namespaces = await this.props.datasource.getNamespaces();

    const state: any = {
      regions,
      namespaces,
      selectedRegion: this.props.datasource.getDefaultRegion(),
      loading: false,
    };
    this.setState(state, () => this.onPropsChange());
  }

  onPropsChange = () => {
    const { regions, namespaces, metrics, dimensionKeys, ...queryModel } = this.state;
    this.props.onChange({ ...queryModel, refId: 'CloudWatchVariableQueryEditor-VariableQuery' });
  };

  async onQueryTypeChange(queryType: string) {
    const state: any = {
      selectedQueryType: queryType,
    };

    this.setState(state);
  }

  /*
    selectedMetric: '',
    selectedDimensionKey: '',
    filters: '',
    instanceID: '',
    attributeName: '',
    resourceType: '',
    tags: '',
    namespaces: [],
    regions: [],
    metrics: [],
    dimensionKeys: [],
  */

  async onRegionChange(region: string) {
    const metrics = await this.props.datasource.getMetrics(this.state.selectedNamespace, region);
    const dimensionKeys = await this.props.datasource.getDimensionKeys(this.state.selectedNamespace, region);
    this.setState(
      {
        selectedRegion: region,
        selectedMetric: metrics.length > 0 ? metrics[0].value : '',
        selectedDimensionKey: dimensionKeys.length > 0 ? dimensionKeys[0].value : '',
        metrics: metrics,
        dimensionKeys: dimensionKeys,
      },
      () => this.onPropsChange()
    );
  }

  async onNamespaceChange(namespace: string) {
    const metrics = await this.props.datasource.getMetrics(namespace, this.state.selectedRegion);
    const dimensionKeys = await this.props.datasource.getDimensionKeys(namespace, this.state.selectedRegion);
    this.setState(
      {
        selectedNamespace: namespace,
        selectedMetric: metrics.length > 0 ? metrics[0].value : '',
        selectedDimensionKey: dimensionKeys.length > 0 ? dimensionKeys[0].value : '',
        metrics: metrics,
        dimensionKeys: dimensionKeys,
      },
      () => this.onPropsChange()
    );
  }

  async onMetricChange(metric: string) {
    this.setState({ selectedMetric: metric }, () => this.onPropsChange());
  }

  async onDimensionKeyChange(key: string) {
    this.setState({ selectedDimensionKey: key }, () => this.onPropsChange());
  }

  async onFiltersChange(filters: string) {
    this.setState({ filters: filters }, () => this.onPropsChange());
  }

  async onInstanceIdChange(id: string) {
    this.setState({ instanceID: id }, () => this.onPropsChange());
  }

  async onAttributeNameChange(attribute: string) {
    this.setState({ attributeName: attribute }, () => this.onPropsChange());
  }

  async onResourceTypeChange(resourceType: string) {
    this.setState({ resourceType: resourceType }, () => this.onPropsChange());
  }

  async onTagsChange(tags: string) {
    this.setState({ tags: tags }, () => this.onPropsChange());
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<VariableQueryData>) {
    const selectQueryTypeChanged = prevState.selectedQueryType !== this.state.selectedQueryType;
    if (selectQueryTypeChanged) {
      this.onPropsChange();
    }
  }

  renderQueryTypeSwitch(queryType: string) {
    const variableOptionGroup = {
      label: 'Template Variables',
      expanded: false,
      options: getTemplateSrv()
        .getVariables()
        .map((v: any) => ({
          value: `$${v.name}`,
          label: `$${v.name}`,
        })),
    };
    console.log('bar', this.state.selectedMetric);

    switch (queryType) {
      case VariableQueryType.Metrics:
      case VariableQueryType.DimensionKeys:
        return (
          <>
            <VariableQueryField
              value={this.state.selectedRegion}
              options={[variableOptionGroup, ...this.state.regions]}
              onChange={(value: string) => this.onRegionChange(value)}
              label="Region"
            />
            <VariableQueryField
              value={this.state.selectedNamespace}
              options={[variableOptionGroup, ...this.state.namespaces]}
              onChange={(value: string) => this.onNamespaceChange(value)}
              label="Namespace"
            />
          </>
        );
      case VariableQueryType.DimensionValues:
        return (
          <>
            <VariableQueryField
              value={this.state.selectedRegion}
              options={[variableOptionGroup, ...this.state.regions]}
              onChange={(value: string) => this.onRegionChange(value)}
              label="Region"
            />
            <VariableQueryField
              value={this.state.selectedNamespace}
              options={[variableOptionGroup, ...this.state.namespaces]}
              onChange={(value: string) => this.onNamespaceChange(value)}
              label="Namespace"
            />
            <VariableQueryField
              value={this.state.selectedMetric}
              options={[variableOptionGroup, ...this.state.metrics]}
              onChange={(value: string) => this.onMetricChange(value)}
              label="Metric"
            />
            <VariableQueryField
              value={this.state.selectedDimensionKey}
              options={[variableOptionGroup, ...this.state.dimensionKeys]}
              onChange={(value: string) => this.onDimensionKeyChange(value)}
              label="Dimension Key"
            />
            <VariableTextField
              value={this.state.filters}
              placeholder="{key:[value]}"
              onBlur={(value: string) => this.onFiltersChange(value)}
              label="Filters"
            />
          </>
        );
      case VariableQueryType.EBSVolumeIDs:
        return (
          <>
            <VariableQueryField
              value={this.state.selectedRegion}
              options={[variableOptionGroup, ...this.state.regions]}
              onChange={(value: string) => this.onRegionChange(value)}
              label="Region"
            />
            <VariableTextField
              value={this.state.instanceID}
              placeholder="instance_id"
              onBlur={(value: string) => this.onInstanceIdChange(value)}
              label="Instance ID"
            />
          </>
        );
      case VariableQueryType.EC2InstanceAttributes:
        return (
          <>
            <VariableQueryField
              value={this.state.selectedRegion}
              options={[variableOptionGroup, ...this.state.regions]}
              onChange={(value: string) => this.onRegionChange(value)}
              label="Region"
            />
            <VariableTextField
              value={this.state.attributeName}
              placeholder="attribute name"
              onBlur={(value: string) => this.onAttributeNameChange(value)}
              label="Attribute Name"
            />
            <VariableTextField
              value={this.state.filters}
              placeholder="{key:[value]}"
              onBlur={(value: string) => this.onFiltersChange(value)}
              label="Filters"
            />
          </>
        );
      case VariableQueryType.ResourceArns:
        return (
          <>
            <VariableQueryField
              value={this.state.selectedRegion}
              options={[variableOptionGroup, ...this.state.regions]}
              onChange={(value: string) => this.onRegionChange(value)}
              label="Region"
            />
            {
              /* <InlineField label="Resource Type" labelWidth={LABEL_WIDTH}>
              <Input placeholder="" value={this.state.resourceType} onBlur={(event) => this.onFiltersChange(event)} />
            </InlineField>*/
              <VariableTextField
                value={this.state.tags}
                placeholder="{tag:[value]}"
                onBlur={(value: string) => this.onTagsChange(value)}
                label="Tags"
              />
            }
          </>
        );
      default:
        return '';
    }
  }

  render() {
    if (this.state.loading) {
      return (
        <div className="gf-form max-width-21">
          <span className="gf-form-label width-10 query-keyword">Query Type</span>
          <div className="gf-form-select-wrapper max-width-12">
            <select className="gf-form-input">
              <option>Loading...</option>
            </select>
          </div>
        </div>
      );
    }

    console.log('foo', this.state.selectedMetric);
    return (
      <>
        <VariableQueryField
          value={this.state.selectedQueryType}
          options={this.queryTypes}
          onChange={(value: string) => this.onQueryTypeChange(value)}
          label="Query Type"
        />
        {this.renderQueryTypeSwitch(this.state.selectedQueryType)}
      </>
    );
  }
}
