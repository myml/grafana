package store

import (
	"context"
	"fmt"

	"xorm.io/builder"

	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

var (
	// ErrNoAlertmanagerConfiguration is an error for when no alertmanager configuration is found.
	ErrNoAlertmanagerConfiguration        = fmt.Errorf("could not find an Alertmanager configuration")
	ErrWrongAlertmanagerConfigurationHash = fmt.Errorf("the passed configuration hash does not match the latest hash")
)

// GetLatestAlertmanagerConfiguration returns the lastest version of the alertmanager configuration.
// It returns ErrNoAlertmanagerConfiguration if no configuration is found.
func (st *DBstore) GetLatestAlertmanagerConfiguration(ctx context.Context, query *models.GetLatestAlertmanagerConfigurationQuery) error {
	return st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		c := &models.AlertConfiguration{}
		// The ID is already an auto incremental column, using the ID as an order should guarantee the latest.
		ok, err := sess.Desc("id").Where("org_id = ?", query.OrgID).Limit(1).Get(c)
		if err != nil {
			return err
		}

		if !ok {
			return ErrNoAlertmanagerConfiguration
		}

		query.Result = c
		return nil
	})
}

// GetAllLatestAlertmanagerConfiguration returns the latest configuration of every organization
func (st *DBstore) GetAllLatestAlertmanagerConfiguration(ctx context.Context) ([]*models.AlertConfiguration, error) {
	var result []*models.AlertConfiguration
	err := st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		condition := builder.In("id", builder.Select("MAX(id)").From("alert_configuration").GroupBy("org_id"))
		if err := sess.Table("alert_configuration").Where(condition).Find(&result); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SaveAlertmanagerConfiguration creates an alertmanager configuration.
func (st DBstore) SaveAlertmanagerConfiguration(ctx context.Context, cmd *models.SaveAlertmanagerConfigurationCmd) error {
	return st.SaveAlertmanagerConfigurationWithCallback(ctx, cmd, func() error { return nil })
}

type SaveCallback func() error

// SaveAlertmanagerConfigurationWithCallback creates an alertmanager configuration version and then executes a callback.
// If the callback results in error it rolls back the transaction.
func (st DBstore) SaveAlertmanagerConfigurationWithCallback(ctx context.Context, cmd *models.SaveAlertmanagerConfigurationCmd, callback SaveCallback) error {
	return st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		config := models.AlertConfiguration{
			AlertmanagerConfiguration: cmd.AlertmanagerConfiguration,
			ConfigurationHash:         cmd.ConfigurationHash,
			ConfigurationVersion:      cmd.ConfigurationVersion,
			Default:                   cmd.Default,
			OrgID:                     cmd.OrgID,
		}
		if _, err := sess.Insert(config); err != nil {
			return err
		}

		if err := callback(); err != nil {
			return err
		}

		return nil
	})
}

func (st *DBstore) UpdateAlertManagerConfiguration(cmd *models.SaveAlertmanagerConfigurationCmd) error {
	return st.SQLStore.WithTransactionalDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
		config := models.AlertConfiguration{
			AlertmanagerConfiguration: cmd.AlertmanagerConfiguration,
			ConfigurationHash:         cmd.ConfigurationHash,
			ConfigurationVersion:      cmd.ConfigurationVersion,
			Default:                   cmd.Default,
			OrgID:                     cmd.OrgID,
		}
		rows, err := sess.Table("alert_configuration").Where(`
			EXISTS (
				SELECT 1 
				FROM alert_configuration 
				WHERE 
					org_id = ? 
				AND 
					id = (SELECT MAX(id) FROM alert_configuration WHERE org_id = ?) 
				AND 
					configuration_hash = ?
			)`,
			cmd.OrgID, cmd.OrgID, cmd.FetechedConfigurationHash).Insert(config)
		if rows == 0 {
			return ErrWrongAlertmanagerConfigurationHash
		}
		return err
	})
}
