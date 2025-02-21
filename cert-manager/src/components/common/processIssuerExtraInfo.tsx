import { NameValueTable, NameValueTableRow } from '@kinvolk/headlamp-plugin/lib/components/common';
import { IssuerSpec } from '../../resources/common';
import {
  ACMEChallengeSolverComponent,
  SecretKeySelectorComponent,
  StringArray,
} from './CommonComponents';

export function processIssuerExtraInfo(spec: IssuerSpec): NameValueTableRow[] {
  const extraInfo: NameValueTableRow[] = [];

  if (spec.acme) {
    extraInfo.push({
      name: 'ACME',
      value: (
        <NameValueTable
          rows={[
            { name: 'Email', value: spec.acme.email },
            { name: 'Server', value: spec.acme.server },
            { name: 'Preferred Chain', value: spec.acme.preferredChain },
            { name: 'CA Bundle', value: spec.acme.caBundle },
            { name: 'Skip TLS Verify', value: spec.acme.skipTLSVerify?.toString() },
            {
              name: 'Private Key Secret Ref',
              value: <SecretKeySelectorComponent selector={spec.acme.privateKeySecretRef} />,
            },
            {
              name: 'External Account Binding',
              value: spec.acme.externalAccountBinding && (
                <NameValueTable
                  rows={[
                    { name: 'Key ID', value: spec.acme.externalAccountBinding.keyID },
                    { name: 'Key Algorithm', value: spec.acme.externalAccountBinding.keyAlgorithm },
                    {
                      name: 'Key Secret Ref',
                      value: (
                        <SecretKeySelectorComponent
                          selector={spec.acme.externalAccountBinding.keySecretRef}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              name: 'Disable Account Key Generation',
              value: spec.acme.disableAccountKeyGeneration?.toString(),
            },
            {
              name: 'Enable Duration Feature',
              value: spec.acme.enableDurationFeature?.toString(),
            },
            {
              name: 'Solvers',
              value: spec.acme.solvers?.map((solver, index) => (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <ACMEChallengeSolverComponent solver={solver} />
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
      name: 'CA',
      value: (
        <NameValueTable
          rows={[
            { name: 'Secret Name', value: spec.ca.secretName },
            {
              name: 'CRL Distribution Points',
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
            { name: 'Server', value: spec.vault.server },
            { name: 'Path', value: spec.vault.path },
            { name: 'CA Bundle', value: spec.vault.caBundle },
            { name: 'Namespace', value: spec.vault.namespace },
            {
              name: 'Auth',
              value: spec.vault.auth && (
                <NameValueTable
                  rows={[
                    {
                      name: 'Token Secret Ref',
                      value: spec.vault.auth.tokenSecretRef && (
                        <SecretKeySelectorComponent selector={spec.vault.auth.tokenSecretRef} />
                      ),
                    },
                    {
                      name: 'App Role',
                      value: spec.vault.auth.appRole && (
                        <NameValueTable
                          rows={[
                            { name: 'Path', value: spec.vault.auth.appRole.path },
                            { name: 'Role ID', value: spec.vault.auth.appRole.roleId },
                            {
                              name: 'Secret Ref',
                              value: (
                                <SecretKeySelectorComponent
                                  selector={spec.vault.auth.appRole.secretRef}
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
                            { name: 'Role', value: spec.vault.auth.kubernetes.role },
                            {
                              name: 'Secret Ref',
                              value: (
                                <SecretKeySelectorComponent
                                  selector={spec.vault.auth.kubernetes.secretRef}
                                />
                              ),
                            },
                            { name: 'Mount Path', value: spec.vault.auth.kubernetes.mountPath },
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
      name: 'Self Signed',
      value: (
        <NameValueTable
          rows={[
            {
              name: 'CRL Distribution Points',
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
            { name: 'Zone', value: spec.venafi.zone },
            {
              name: 'TPP',
              value: spec.venafi.tpp && (
                <NameValueTable
                  rows={[
                    { name: 'URL', value: spec.venafi.tpp.url },
                    {
                      name: 'Credentials Ref',
                      value: (
                        <SecretKeySelectorComponent selector={spec.venafi.tpp.credentialsRef} />
                      ),
                    },
                    { name: 'CA Bundle', value: spec.venafi.tpp.caBundle },
                  ]}
                />
              ),
            },
            {
              name: 'Cloud',
              value: spec.venafi.cloud && (
                <NameValueTable
                  rows={[
                    { name: 'URL', value: spec.venafi.cloud.url },
                    {
                      name: 'API Token Secret Ref',
                      value: (
                        <SecretKeySelectorComponent
                          selector={spec.venafi.cloud.apiTokenSecretRef}
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
