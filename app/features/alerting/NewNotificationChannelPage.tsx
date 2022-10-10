import { Page } from 'app/core/components/Page/Page';
import { getNavModel } from 'app/core/selectors/navModel';
import { Form } from 'packages/grafana-ui/src';
import React, { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { config } from '@grafana/runtime';

import { NotificationChannelDTO, StoreState } from '../../types';

import { NotificationChannelForm } from './components/NotificationChannelForm';
import { createNotificationChannel, loadNotificationTypes, testNotificationChannel } from './state/actions';
import { resetSecureField } from './state/reducers';
import {
  defaultValues,
  mapChannelsToSelectableValue,
  transformSubmitData,
  transformTestData,
} from './utils/notificationChannels';

class NewNotificationChannelPage extends PureComponent<Props> {
  componentDidMount() {
    this.props.loadNotificationTypes();
  }

  onSubmit = (data: NotificationChannelDTO) => {
    this.props.createNotificationChannel(transformSubmitData({ ...defaultValues, ...data }));
  };

  onTestChannel = (data: NotificationChannelDTO) => {
    this.props.testNotificationChannel(transformTestData({ ...defaultValues, ...data }));
  };

  render() {
    const { navModel, notificationChannelTypes } = this.props;

    return (
      <Page navModel={navModel}>
        <Page.Contents>
          <h2 className="page-sub-heading">New notification channel</h2>
          <Form onSubmit={this.onSubmit} validateOn="onChange" defaultValues={defaultValues} maxWidth={600}>
            {({ register, errors, control, getValues, watch }) => {
              const selectedChannel = notificationChannelTypes.find((c) => c.value === getValues().type.value);

              return (
                <NotificationChannelForm
                  selectableChannels={mapChannelsToSelectableValue(notificationChannelTypes, true)}
                  selectedChannel={selectedChannel}
                  onTestChannel={this.onTestChannel}
                  register={register}
                  errors={errors}
                  getValues={getValues}
                  control={control}
                  watch={watch}
                  imageRendererAvailable={config.rendererAvailable}
                  resetSecureField={this.props.resetSecureField}
                  secureFields={{}}
                />
              );
            }}
          </Form>
        </Page.Contents>
      </Page>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'channels'),
  notificationChannelTypes: state.notificationChannel.notificationChannelTypes,
});

const mapDispatchToProps = {
  createNotificationChannel,
  loadNotificationTypes,
  testNotificationChannel,
  resetSecureField,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type Props = ConnectedProps<typeof connector>;
export default connector(NewNotificationChannelPage);
