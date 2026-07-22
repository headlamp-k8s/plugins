import { NameValueTable, NameValueTableRow } from '@kinvolk/headlamp-plugin/lib/components/common';
import { IssuerSpec } from '../../resources/common';
import {
  ACMEChallengeSolverComponent,
  SecretKeySelectorComponent,
  StringArray,
} from './CommonComponents';

export function processIssuerExtraInfo(
  spec: IssuerSpec,
  namespace: string | undefined,
  t: (key: string) => string
): NameValueTableRow[] {
  const extraInfo: NameValueTableRow[] = [];

  if (spec.acme) {
    extraInfo.push({
      name: 'ACME',
      value: (
        <NameValueTable
          rows={[
            { name: t('Email'), value: spec.acme.email },
            { name: t('Server'), value: spec.acme.server },
            { name: t('Preferred Chain'), value: spec.acme.preferredChain },
            { name: t('CA Bundle'), value: spec.acme.caBundle },
            {
              name: t('Skip TLS Verify'),
              value:
                spec.acme.skipTLSVerify === undefined
                  ? undefined
                  : spec.acme.skipTLSVerify
                  ? t('Yes')
                  : t('No'),
            },
            {
              name: t('Private Key Secret Ref'),
              value: (
                <SecretKeySelectorComponent
                  selector={spec.acme.privateKeySecretRef}
                  namespace={namespace}
                />
              ),
            },
            {
              name: t('External Account Binding'),
              value: spec.acme.externalAccountBinding && (
                <NameValueTable
                  rows={[
                    { name: t('Key ID'), value: spec.acme.externalAccountBinding.keyID },
                    {
                      name: t('Key Algorithm'),
                      value: spec.acme.externalAccountBinding.keyAlgorithm,
                    },
                    {
                      name: t('Key Secret Ref'),
                      value: (
                        <SecretKeySelectorComponent
                          selector={spec.acme.externalAccountBinding.keySecretRef}
                          namespace={namespace}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              name: t('Disable Account Key Generation'),
              value:
                spec.acme.disableAccountKeyGeneration === undefined
                  ? undefined
                  : spec.acme.disableAccountKeyGeneration
                  ? t('Yes')
                  : t('No'),
            },
            {
              name: t('Enable Duration Feature'),
              value:
                spec.acme.enableDurationFeature === undefined
                  ? undefined
                  : spec.acme.enableDurationFeature
                  ? t('Yes')
                  : t('No'),
            },
            {
              name: t('Solvers'),
              value: spec.acme.solvers?.map((solver, index) => (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <ACMEChallengeSolverComponent solver={solver} namespace={namespace} />
                </div>
              )),
            },
          ]}
        />
      ),
    });
  }

  if (spec.ca) {
    extraInfo.push({
      name: t('CA'),
      value: (
        <NameValueTable
          rows={[
            { name: t('Secret Name'), value: spec.ca.secretName },
            {
              name: t('CRL Distribution Points'),
              value: <StringArray items={spec.ca.crlDistributionPoints} />,
            },
          ]}
        />
      ),
    });
  }

  if (spec.vault) {
    extraInfo.push({
      name: 'Vault',
      value: (
        <NameValueTable
          rows={[
            { name: t('Server'), value: spec.vault.server },
            { name: t('Path'), value: spec.vault.path },
            { name: t('CA Bundle'), value: spec.vault.caBundle },
            { name: t('Namespace'), value: spec.vault.namespace },
            {
              name: t('Auth'),
              value: spec.vault.auth && (
                <NameValueTable
                  rows={[
                    {
                      name: t('Token Secret Ref'),
                      value: spec.vault.auth.tokenSecretRef && (
                        <SecretKeySelectorComponent
                          selector={spec.vault.auth.tokenSecretRef}
                          namespace={namespace}
                        />
                      ),
                    },
                    {
                      name: t('App Role'),
                      value: spec.vault.auth.appRole && (
                        <NameValueTable
                          rows={[
                            { name: t('Path'), value: spec.vault.auth.appRole.path },
                            { name: t('Role ID'), value: spec.vault.auth.appRole.roleId },
                            {
                              name: t('Secret Ref'),
                              value: (
                                <SecretKeySelectorComponent
                                  selector={spec.vault.auth.appRole.secretRef}
                                  namespace={namespace}
                                />
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      name: 'Kubernetes',
                      value: spec.vault.auth.kubernetes && (
                        <NameValueTable
                          rows={[
                            { name: t('Role'), value: spec.vault.auth.kubernetes.role },
                            {
                              name: t('Secret Ref'),
                              value: (
                                <SecretKeySelectorComponent
                                  selector={spec.vault.auth.kubernetes.secretRef}
                                  namespace={namespace}
                                />
                              ),
                            },
                            { name: t('Mount Path'), value: spec.vault.auth.kubernetes.mountPath },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      ),
    });
  }

  if (spec.selfSigned) {
    extraInfo.push({
      name: t('Self Signed'),
      value: (
        <NameValueTable
          rows={[
            {
              name: t('CRL Distribution Points'),
              value: <StringArray items={spec.selfSigned.crlDistributionPoints} />,
            },
          ]}
        />
      ),
    });
  }

  if (spec.venafi) {
    extraInfo.push({
      name: 'Venafi',
      value: (
        <NameValueTable
          rows={[
            { name: t('Zone'), value: spec.venafi.zone },
            {
              name: 'TPP',
              value: spec.venafi.tpp && (
                <NameValueTable
                  rows={[
                    { name: t('URL'), value: spec.venafi.tpp.url },
                    {
                      name: t('Credentials Ref'),
                      value: (
                        <SecretKeySelectorComponent
                          selector={spec.venafi.tpp.credentialsRef}
                          namespace={namespace}
                        />
                      ),
                    },
                    { name: t('CA Bundle'), value: spec.venafi.tpp.caBundle },
                  ]}
                />
              ),
            },
            {
              name: t('Cloud'),
              value: spec.venafi.cloud && (
                <NameValueTable
                  rows={[
                    { name: t('URL'), value: spec.venafi.cloud.url },
                    {
                      name: t('API Token Secret Ref'),
                      value: (
                        <SecretKeySelectorComponent
                          selector={spec.venafi.cloud.apiTokenSecretRef}
                          namespace={namespace}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      ),
    });
  }

  return extraInfo;
}
