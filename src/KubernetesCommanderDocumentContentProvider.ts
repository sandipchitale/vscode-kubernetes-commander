import * as vscode from "vscode";
import * as k8s from 'vscode-kubernetes-tools-api';
import { TextDocument, TextEditor } from 'vscode';

export class KubernetesCommanderDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private rawKubernetesCommanderBuffer = '';

  private kubectlApi: k8s.KubectlV1 | undefined = undefined;
  private configurationApi: k8s.ConfigurationV1 | undefined = undefined;

  // private explorerApi: k8s.ClusterExplorerV1 | undefined = undefined;

  static readonly KUBERNETES_COMMANDER = 'kubernetes-commander'

  // Interesting order
  private static apiResourceNamesOrder = [
    'nodes',
    'namespaces',
    'pods',
    'podtemplates',
    'cronjobs',
    'daemonsets',
    'deployments',
    'replicasets',
    'jobs',
    'statefulsets',
    'replicationcontrollers',
    'configmaps',
    'secrets',
    'storageclasses',
    'persistentvolumes',
    'persistentvolumeclaims',
    'volumeattachments',

    'services',
    'endpoints',
    'endpointslices',

    'ingressclasses',
    'ingresses',

    'events',

    'serviceaccounts',
    'certificatesigningrequests',

    'clusterroles',
    'clusterrolebindings',
    'roles',
    'rolebindings',

    'limitranges',
    'resourcequotas',
    'horizontalpodautoscalers',

    'customresourcedefinitions',

    // 'apiservices',
    // 'bindings',
    // 'componentstatuses',
    // 'controllerrevisions',
    // 'csidrivers',
    // 'csinodes',
    // 'leases',
    // 'localsubjectaccessreviews',
    // 'mutatingwebhookconfigurations',
    // 'networkpolicies',
    // 'poddisruptionbudgets',
    // 'podsecuritypolicies',
    // 'priorityclasses',
    // 'runtimeclasses',
    // 'selfsubjectaccessreviews',
    // 'selfsubjectrulesreviews',
    // 'subjectaccessreviews',
    // 'tokenreviews',
    // 'validatingwebhookconfigurations',
  ];

  private static docsUrlPrefix = 'https://kubernetes.io/docs/reference/kubernetes-api/';

  private static docsUrlSuffix: any = {
    apiservices: 'cluster-resources/api-service-v1',
    bindings: 'cluster-resources/binding-v1',
    certificatesigningrequests: 'authentication-resources/certificate-signing-request-v1',
    clusterrolebindings: 'authorization-resources/cluster-role-binding-v1',
    clusterroles: 'authorization-resources/cluster-role-v1',
    componentstatuses: 'cluster-resources/component-status-v1',
    configmaps: 'config-and-storage-resources/config-map-v1',
    controllerrevisions: 'workload-resources/controller-revision-v1',
    cronjobs: 'workload-resources/cron-job-v1',
    csidrivers: 'config-and-storage-resources/csi-driver-v1',
    csinodes: 'config-and-storage-resources/csi-node-v1',
    customresourcedefinitions: 'extend-resources/custom-resource-definition-v1',
    daemonsets: 'workload-resources/daemon-set-v1',
    deployments: 'workload-resources/deployment-v1',
    endpoints: 'service-resources/endpoints-v1',
    endpointslices: 'service-resources/endpoint-slice-v1',
    events: 'cluster-resources/event-v1',
    horizontalpodautoscalers: 'workload-resources/horizontal-pod-autoscaler-v1',
    ingressclasses: 'service-resources/ingress-class-v1',
    ingresses: 'service-resources/ingress-v1',
    jobs: 'workload-resources/job-v1',
    leases: 'cluster-resources/lease-v1',
    limitranges: 'policy-resources/limit-range-v1',
    localsubjectaccessreviews: 'authorization-resources/local-subject-access-review-v1',
    mutatingwebhookconfigurations: 'extend-resources/mutating-webhook-configuration-v1',
    namespaces: 'cluster-resources/namespace-v1',
    networkpolicies: 'policy-resources/network-policy-v1',
    nodes: 'cluster-resources/node-v1',
    persistentvolumeclaims: 'config-and-storage-resources/persistent-volume-claim-v1',
    persistentvolumes: 'config-and-storage-resources/persistent-volume-v1',
    poddisruptionbudgets: 'policy-resources/pod-disruption-budget-v1',
    pods: 'workload-resources/pod-v1',
    podsecuritypolicies: 'policy-resources/pod-security-policy-v1beta1',
    podtemplates: 'workload-resources/pod-template-v1',
    priorityclasses: 'workload-resources/priority-class-v1',
    replicasets: 'workload-resources/replica-set-v1',
    replicationcontrollers: 'workload-resources/replication-controller-v1',
    resourcequotas: 'policy-resources/resource-quota-v1',
    rolebindings: 'authorization-resources/role-binding-v1',
    roles: 'authorization-resources/role-v1',
    runtimeclasses: 'cluster-resources/runtime-class-v1',
    secrets: 'config-and-storage-resources/secret-v1',
    selfsubjectaccessreviews: 'authorization-resources/self-subject-access-review-v1',
    selfsubjectrulesreviews: 'authorization-resources/self-subject-rules-review-v1',
    serviceaccounts: 'authentication-resources/service-account-v1',
    services: 'service-resources/service-v1',
    statefulsets: 'workload-resources/stateful-set-v1',
    storageclasses: 'config-and-storage-resources/storage-class-v1',
    subjectaccessreviews: 'authorization-resources/subject-access-review-v1',
    tokenreviews: 'authentication-resources/token-review-v1',
    validatingwebhookconfigurations: 'extend-resources/validating-webhook-configuration-v1',
    volumeattachments: 'config-and-storage-resources/volume-attachment-v1',
  }

  // emitter and its event
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  private uri: vscode.Uri | undefined = undefined;

  private kubernetesCommanderTextDocument: undefined | TextDocument;
  private kubernetesCommanderTextEditor: undefined | TextEditor;

  constructor() {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.uri.scheme === KubernetesCommanderDocumentContentProvider.KUBERNETES_COMMANDER) {
        editor.options = {
          cursorStyle: vscode.TextEditorCursorStyle.BlockOutline,
        };
        vscode.commands.executeCommand('setContext', 'vscode-kubernetes-commander', true);
        // this.reload();
      } else {
        vscode.commands.executeCommand('setContext', 'vscode-kubernetes-commander', false);
      }
    });

    (async () => {
      const kubectl = await k8s.extension.kubectl.v1;
      if (!kubectl.available) {
          vscode.window.showErrorMessage(`kubectl not available.`);
          return;
      } else {
        this.kubectlApi = kubectl.api;
      }

      const configuration = await k8s.extension.configuration.v1_1;
      if (configuration.available) {
        this.configurationApi = configuration.api;
        configuration.api.onDidChangeKubeconfigPath((kubeconfigPath) => {
          setTimeout(() => {
            this.reload();
          }, 1000);
        });
        configuration.api.onDidChangeContext((namespace) => {
          // current context is changed, do something with it
          setTimeout(() => {
            this.reload();
          }, 1000);
        });
        configuration.api.onDidChangeNamespace((namespace) => {
          // current namespace is changed, do something with it
          setTimeout(() => {
            this.reload();
          }, 1000);
        });
      }
      // const explorer = await k8s.extension.clusterExplorer.v1;
      // if (!explorer.available) {
      //     return;
      // } else {
      //   this.explorerApi = explorer.api;
      //   this.explorerApi.registerNodeUICustomizer({
      //     customize(node, treeItem): void {
      //       console.log(node);
      //       console.log(treeItem);
      //     }
      //   });
      // }
    })();
  }

  provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    return this.buffer(uri);
  }

  dispose(): any {
    this.kubernetesCommanderTextDocument = undefined;
    this.kubernetesCommanderTextEditor = undefined;

    this.onDidChangeEmitter.dispose();
  }

  async buffer(uri: vscode.Uri): Promise<string> {
    this.uri = uri;
    return new Promise((resolve, reject) => {
      (async () => {
        if (this.kubectlApi) {
          let versions = {};
          const versionsShellResult = await this.kubectlApi.invokeCommand('version --short --output=json');
          if (versionsShellResult) {
            // if (versionsShellResult.stdout && versionsShellResult.stdout.length > 0) {
            if (versionsShellResult.code === 0) {
              versions = JSON.parse(versionsShellResult.stdout);
            }
          }

          let kubeconfigPath = '';
          if (this.configurationApi) {
            const kubeconfigPathObject = this.configurationApi.getKubeconfigPath();
            if (kubeconfigPathObject.pathType === 'host') {
              kubeconfigPath = kubeconfigPathObject.hostPath;
            } else {
              kubeconfigPath = kubeconfigPathObject.wslPath;
            }
          }

          let context = '';
          const contextShellResult = await this.kubectlApi.invokeCommand('config current-context');
          if (contextShellResult) {
            if (contextShellResult.code === 0) {
              context = contextShellResult.stdout.split(/\r?\n/g).join('');
            }
          }

          let namespace = '';
          const namespaceShellResult = await this.kubectlApi.invokeCommand('config view --minify --output "jsonpath={..namespace}"');
          if (namespaceShellResult) {
            if (namespaceShellResult.code === 0) {
              namespace = namespaceShellResult.stdout.split(/\r?\n/g).join('');
            }
          }

          const apiResourcesShellResult = await this.kubectlApi.invokeCommand('api-resources');
          if (apiResourcesShellResult) {
            if (apiResourcesShellResult.stdout && apiResourcesShellResult.stdout.length > 0) {
              const apiResourcesRaw = apiResourcesShellResult.stdout.replace(/true /g, '✔    ').replace(/false/g, '-    ').split('\n');
              const apiResourcesHeaderRaw = `${apiResourcesRaw.shift()}                               `;

              const columns = apiResourcesHeaderRaw?.match(/^(NAME\s+)(SHORTNAMES\s+)(APIVERSION\s+|APIGROUP\s+)(NAMESPACED\s+)(KIND\s+)$/);
              columns?.shift();

              const columnRanges: number[][] = [];
              let from = 0;
              let to = 0;
              columns?.forEach((column) => {
                to += column.length;
                columnRanges.push([from, to]);
                from = to;
              });

              const trimmedColumns = columns?.map((c) => c.trim()) || [];

              const apiResourcesHeader =
                `${trimmedColumns[0].padEnd(36)} ${trimmedColumns[1].padEnd(20)} ${trimmedColumns[2].padEnd(36)} ${trimmedColumns[3].padStart(10)} ${trimmedColumns[4]}`;

              const apiResources: string[] = [];
              apiResourcesRaw.forEach((apiResource) => {
                const apiResourcesCols: string[] = [];
                columnRanges.forEach(columnRange => {
                  apiResourcesCols.push(apiResource.substring(columnRange[0], columnRange[1]).trim());
                });
                apiResources.push(
                  `${apiResourcesCols[0].padEnd(36)} ${apiResourcesCols[1].padEnd(20)} ${apiResourcesCols[2].padEnd(36)} ${apiResourcesCols[3].padStart(10)} ${apiResourcesCols[4]}`
                );
              });

              apiResources.pop();
              apiResources.sort();

              // Order
              const orderedApiResources = [];
              const resourceTypes = vscode.workspace.getConfiguration().get<string[]>('vscode-kubernetes-commander.resourceTypes');
              if (resourceTypes) {
                KubernetesCommanderDocumentContentProvider.apiResourceNamesOrder = resourceTypes;
              }
              KubernetesCommanderDocumentContentProvider.apiResourceNamesOrder.forEach((apiResourceName) => {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                  const index = apiResources.findIndex(line => line.startsWith(`${apiResourceName} `));
                  if (index === -1) {
                    break;
                  } else {
                    orderedApiResources.push(...apiResources.splice(index, 1));
                  }
                }
              });

              const resourceTypesShowOnly = vscode.workspace.getConfiguration().get<string>('vscode-kubernetes-commander.resourceTypesShowOnly');
              if (!resourceTypesShowOnly) {
                orderedApiResources.push(...apiResources);
              }

              this.rawKubernetesCommanderBuffer = `Kubeconfig: ${kubeconfigPath}\nContext: ${context} Namespace: ${namespace} ${versions} ( Hover for help )\n\n${apiResourcesHeader}\n${orderedApiResources.join('\n')}`;
              resolve(this.rawKubernetesCommanderBuffer);
            } else {
              reject(apiResourcesShellResult.stderr);
            }
          } else {
              reject('api-resources not available');
          }
        } else {
          reject('kubectl not available');
        }
      })();
    });
  }

  open(dir: string) {
    this.rawKubernetesCommanderBuffer = '';
    if (this.kubernetesCommanderTextDocument) {
      vscode.window.showTextDocument(this.kubernetesCommanderTextDocument, { preview: false }).then(() => {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor").then(async () => {
          this._open(dir);
        });
      });
    } else {
      this._open(dir);
    }
  }

  private async _open(dir: string) {
    const uri = vscode.Uri.parse(`${KubernetesCommanderDocumentContentProvider.KUBERNETES_COMMANDER}:///${dir}`);
    this.kubernetesCommanderTextDocument = await vscode.workspace.openTextDocument(uri);
    vscode.languages.setTextDocumentLanguage(this.kubernetesCommanderTextDocument, KubernetesCommanderDocumentContentProvider.KUBERNETES_COMMANDER);
    this.kubernetesCommanderTextEditor = await vscode.window.showTextDocument(this.kubernetesCommanderTextDocument, { preview: false });
    this.kubernetesCommanderTextEditor.options.insertSpaces = false;
    this.kubernetesCommanderTextEditor.options.tabSize = 0;
    this._goto(4);
  }

  private async _selectAndExecute(editor: vscode.TextEditor, command: string, allNamespaces = false, options = '') {
    const lineNumber = editor.selection.start.line;
    const lineCount = editor.document.lineCount;
    if (lineNumber > 1 && lineNumber < lineCount - 1) {
      const lineText = this.kubernetesCommanderTextDocument?.lineAt(lineNumber);
      const resourceTypeName = lineText!.text.substring(0, 34).trim();
      if (command === 'exec -i -t' && resourceTypeName === 'nodes') {
        // OK
      } else if ((command === 'logs' || command === 'exec -i -t') && resourceTypeName !== 'pods') {
        return;
      }
      const namespaced = lineText!.text.includes('✔');
      const namesShellResult = await this.kubectlApi?.invokeCommand(`get ${resourceTypeName} ${allNamespaces ? '-A' : ''} -o custom-columns=":metadata.name${namespaced ? ',:metadata.namespace' : ''}"`);
      if (namesShellResult) {
        if (namesShellResult.code === 0) {
          let names = namesShellResult.stdout.split(/\r?\n/g).filter(line => line.trim().length > 0);
          if (namespaced) {
            names = names.map(name => name.replace(/\s+/, '@'));
          }
          let selectedResourceName = await vscode.window.showQuickPick(names);
          if (selectedResourceName) {
            if (command === 'exec -i -t' && resourceTypeName === 'nodes') {
              if (options.endsWith('/proc/sys/kernel/random/entropy_avail')) {
                this._nodeEntropy(selectedResourceName);
              } else {
                this._shellIntoNode(selectedResourceName);
              }
              return;
            }
            if (namespaced) {
              const selectedResourceNameParts = selectedResourceName.split('@');
              selectedResourceName = selectedResourceNameParts[0];
              options = `-n ${selectedResourceNameParts[1]} ` + options;
            }
            this._execute(editor, command, selectedResourceName, options);
          }
        }
      }
    }
  }

  private async _shellIntoNode(nodeName: string) {
    const nsenterImage = vscode.workspace.getConfiguration().get<string>('vscode-kubernetes-commander.nsenter-image');
    if (!nsenterImage) {
      vscode.commands.executeCommand( 'workbench.action.openSettings', '@ext:sandipchitale.vscode-kubernetes-commander');
      vscode.window.showErrorMessage(`Must set nsenter image in config: 'vscode-kubernetes-commander.nsenter-image'`);
      return;
    }

    const nodeHostNameShellResult = await this.kubectlApi?.invokeCommand(`get nodes ${nodeName} --no-headers -o custom-columns=":metadata.labels['kubernetes\\.io/hostname']"`);
    if (nodeHostNameShellResult && nodeHostNameShellResult.code === 0) {
      const nodeHostName = nodeHostNameShellResult.stdout.split(/\r?\n/g).join('');
      if (process.platform === 'win32') {
        vscode.window.activeTerminal?.sendText(
          `kubectl run nsenter-${nodeHostName} --restart=Never -it --rm --image=overriden --overrides="{"""spec""":{"""hostPID""":true,"""hostNetwork""":true,"""nodeSelector""":{"""kubernetes.io/hostname""":"""${nodeHostName}"""},"""tolerations""":[{"""operator""":"""Exists"""}],"""containers""":[{"""name""":"""nsenter""","""image""":"""${nsenterImage}""","""command""":["""/nsenter""","""--all""","""--target=1""","""--""","""su""","""-"""],"""stdin""":true,"""tty""":true,"""securityContext""":{"""privileged""":true}}]}}" --attach ${nodeName}`);
      } else {
        vscode.window.activeTerminal?.sendText(`kubectl run nsenter-${nodeHostName} --restart=Never -it --rm --image=overriden --overrides='{"spec":{"hostPID":true,"hostNetwork":true,"nodeSelector":{"kubernetes.io/hostname":"${nodeHostName}"},"tolerations":[{"operator":"Exists"}],"containers":[{"name":"nsenter","image":"${nsenterImage}","command":["/nsenter","--all","--target=1","--","su","-"],"stdin":true,"tty":true,"securityContext":{"privileged":true}}]}}' --attach ${nodeName}`);
      }
    }
  }

  private async _nodeEntropy(nodeName: string) {
    const nsenterImage = vscode.workspace.getConfiguration().get<string>('vscode-kubernetes-commander.nsenter-image');
    if (!nsenterImage) {
      vscode.commands.executeCommand( 'workbench.action.openSettings', '@ext:sandipchitale.vscode-kubernetes-commander');
      vscode.window.showErrorMessage(`Must set nsenter image in config: 'vscode-kubernetes-commander.nsenter-image'`);
      return;
    }

    const nodeHostNameShellResult = await this.kubectlApi?.invokeCommand(`get nodes ${nodeName} --no-headers -o custom-columns=":metadata.labels['kubernetes\\.io/hostname']"`);
    if (nodeHostNameShellResult && nodeHostNameShellResult.code === 0) {
      const nodeHostName = nodeHostNameShellResult.stdout.split(/\r?\n/g).join('');
      if (process.platform === 'win32') {
        vscode.window.activeTerminal?.sendText(
          `kubectl run nsenter-${nodeHostName} --restart=Never -it --rm --image=overriden --overrides="{"""spec""":{"""hostPID""":true,"""hostNetwork""":true,"""nodeSelector""":{"""kubernetes.io/hostname""":"""${nodeHostName}"""},"""tolerations""":[{"""operator""":"""Exists"""}],"""containers""":[{"""name""":"""nsenter""","""image""":"""${nsenterImage}""","""command""":["""/nsenter""","""--all""","""--target=1""","""--""","""su""","""-""","""-c""","""echo -n Entropy on node is :;/bin/cat /proc/sys/kernel/random/entropy_avail;exit"""],"""stdin""":true,"""tty""":true,"""securityContext""":{"""privileged""":true}}]}}" --attach ${nodeName}`);
      } else {
        vscode.window.activeTerminal?.sendText(`kubectl run nsenter-${nodeHostName} --restart=Never -it --rm --image=overriden --overrides='{"spec":{"hostPID":true,"hostNetwork":true,"nodeSelector":{"kubernetes.io/hostname":"${nodeHostName}"},"tolerations":[{"operator":"Exists"}],"containers":[{"name":"nsenter","image":"${nsenterImage}","command":["/nsenter","--all","--target=1","--","su","-","-c","echo -n Entropy on node is :;/bin/cat /proc/sys/kernel/random/entropy_avail;exit"],"stdin":true,"tty":true,"securityContext":{"privileged":true}}]}}' --attach ${nodeName}`);
      }
    }
  }

  private async _execute(editor: vscode.TextEditor, command: string, resource = '', options = '') {
    this.focusTerminalView();
    const lineNumber = editor.selection.start.line;
    const lineCount = editor.document.lineCount;
    if (lineNumber > 1 && lineNumber < lineCount - 1) {
      const lineText = this.kubernetesCommanderTextDocument?.lineAt(lineNumber);
      let resourceTypeName = lineText!.text.substring(0, 34).trim();
      if (command === 'logs' || command === 'exec -i -t') {
        resourceTypeName = '';
      }
      if (command === 'describe') {
        const describeShellResult = await this.kubectlApi?.invokeCommand(`${command} ${resourceTypeName} ${resource} ${options}`);
        if (describeShellResult && describeShellResult.code === 0) {
          const describeDocument: vscode.TextDocument = await vscode.workspace.openTextDocument({
            language: 'plaintext',
            content: `${describeShellResult.stdout}`
          });
          await vscode.window.showTextDocument(describeDocument, vscode.ViewColumn.Beside);
        }
      } else {
        vscode.window.activeTerminal?.sendText(`kubectl ${command} ${resourceTypeName} ${resource} ${options}`);
      }
    }
  }

  async editKubeConfig() {
    let kubeconfigPath = '';
    if (this.configurationApi) {
      const kubeconfigPathObject = this.configurationApi.getKubeconfigPath();
      if (kubeconfigPathObject.pathType === 'host') {
        kubeconfigPath = kubeconfigPathObject.hostPath;
      } else {
        kubeconfigPath = kubeconfigPathObject.wslPath;
      }
      const kubeConfigTextDocument = await vscode.workspace.openTextDocument(kubeconfigPath);
      vscode.languages.setTextDocumentLanguage(kubeConfigTextDocument, 'yaml');
      const kubeConfigTextEditor = await vscode.window.showTextDocument(kubeConfigTextDocument, { preview: false });
    }
  }

  describe(editor: vscode.TextEditor) {
    this._execute(editor, 'describe');
  }

  describeAllNamespaces(editor: vscode.TextEditor) {
    this._execute(editor, 'describe', '-A');
  }

  describeSpecific(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'describe');
  }

  describeSpecificAllNamespaces(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'describe', true);
  }

  editSpecific(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'edit');
  }

  editSpecificAllNamespaces(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'edit', true);
  }

  explain(editor: vscode.TextEditor) {
    this._execute(editor, 'explain');
  }

  get(editor: vscode.TextEditor) {
    this._execute(editor, 'get');
  }

  getAllNamespaces(editor: vscode.TextEditor) {
    this._execute(editor, 'get', '-A');
  }

  getSpecific(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'get');
  }

  getSpecificAllNamespaces(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'get', true);
  }

  logSpecificPod(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'logs');
  }

  logSpecificPodAllNamespaces(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'logs', true);
  }

  names(editor: vscode.TextEditor) {
    this._execute(editor, 'get', '-o custom-columns=":metadata.name"');
  }

  namesAllNamespaces(editor: vscode.TextEditor) {
    this._execute(editor, 'get', '-A -o custom-columns=":metadata.name"');
  }

  shellIntoSpecificPod(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'exec -i -t', false, `-- ${this.shell}`);
  }

  shellIntoSpecificPodAllNamespaces(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'exec -i -t', true, `-- ${this.shell}`);
  }

  private get shell() {
    let shell = vscode.workspace.getConfiguration('vscode-kubernetes-commander').get('shell') || '/bin/sh';
    // Only allow sh or bash
    if (shell !== '/bin/sh' && shell !== '/bin/bash') {
      shell = '/bin/sh';
    }
    return shell;
  }

  tailLogSpecificPod(editor: vscode.TextEditor) {
    const tailLines = vscode.workspace.getConfiguration('vscode-kubernetes-commander').get('tail-lines');
    this._selectAndExecute(editor, 'logs', false, `-f --tail=${tailLines}`);
  }

  tailLogSpecificPodAllNamespaces(editor: vscode.TextEditor) {
    const tailLines = vscode.workspace.getConfiguration('vscode-kubernetes-commander').get('tail-lines');
    this._selectAndExecute(editor, 'logs', true, `-f --tail=${tailLines}`);
  }

  nodeEntropy(editor: vscode.TextEditor) {
    this._selectAndExecute(editor, 'exec -i -t', false, `-- /bin/cat /proc/sys/kernel/random/entropy_avail`);
  }

  private focusTerminalView() {
    vscode.commands.executeCommand('terminal.focus');
  }

  documentation(editor: vscode.TextEditor) {
    const lineNumber = editor.selection.start.line;
    const lineCount = editor.document.lineCount;
    if (lineNumber > 0 && lineNumber < lineCount - 1) {
      const lineText = this.kubernetesCommanderTextDocument?.lineAt(lineNumber);
      const resourceTypeName = lineText!.text.substring(0, 34).trim();
      const docsUrlSuffix = KubernetesCommanderDocumentContentProvider.docsUrlSuffix[resourceTypeName];
      if (docsUrlSuffix) {
        vscode.env.openExternal(
          vscode.Uri.parse(`${KubernetesCommanderDocumentContentProvider.docsUrlPrefix}${docsUrlSuffix}`));
      }
    }
  }

  async hover(document: vscode.TextDocument, position: vscode.Position) {
    return new Promise<vscode.MarkdownString>((resolve, reject) => {
      (async () => {
        if (position.line === 0 || position.line === 1) {
          const markdown = new vscode.MarkdownString();
          markdown.appendMarkdown(`
|Keybinding|Command|
|---|---|
|\`\`\`c\`\`\`|Edit Kube Config|
|\`\`\`d\`\`\`|Describe specific resources|
|\`\`\`shift+d\`\`\`|Describe specific resources from All Namespaces|
|\`\`\`ctrl+d\`\`\`|Describe resources of type|
|\`\`\`ctrl+alt+shift+d\`\`\`|Describe resources of type from All Namespaces|
|\`\`\`e\`\`\`|Edit specific resources|
|\`\`\`shift+e\`\`\`|Edit specific resources from All Namespaces|
|\`\`\`g\`\`\`|Get specific resources|
|\`\`\`shift+g\`\`\`|Get specific resources from All Namespaces|
|\`\`\`ctrl+g\`\`\`|Get resources of type|
|\`\`\`ctrl+alt+shift+g\`\`\`|Get resources of type from All Namespaces|
|\`\`\`h\`\`\`|Documentation for resources of type|
|\`\`\`l\`\`\`|Log specific pod|
|\`\`\`shift+l\`\`\`|Log specific pod from All Namespaces|
|\`\`\`n\`\`\`|List Names of resources of type|
|\`\`\`shift+n\`\`\`|List Names of resources of type All Namespaces|
|\`\`\`s\`\`\`|Shell into specific pod or node. Uses \`\`\`nsenter\`\`\` images to shell into node.|
|\`\`\`shift+s\`\`\`|Shell into specific pod from All Namespaces|
|\`\`\`t\`\`\`|Tail log specific pod|
|\`\`\`shift+t\`\`\`|Tail log specific pod from All Namespaces|
|\`\`\`F5\`\`\`|Reload|
|\`\`\`w\`\`\`|Switch namespace|
|\`\`\`x\`\`\`|Explain Resource Type|
|\`\`\`y\`\`\`|Entropy on Node. Uses \`\`\`nsenter\`\`\` images to execute the command.|
|\`\`\`CTRL+,\`\`\`|Settings|
|\`\`\`q\`\`\`|Quit|`
          );
          resolve(markdown);
          return;
        } else {
          const lineText = document.lineAt(position.line);
          const resourceTypeName = lineText!.text.substring(0, 34).trim();
          const markdown = new vscode.MarkdownString();
          if (resourceTypeName) {
            if (position.character < 91) {
              const getOptions = vscode.workspace.getConfiguration('vscode-kubernetes-commander').get('get-options') || '';
              const getShellResult = await this.kubectlApi?.invokeCommand(`get ${resourceTypeName} -A ${getOptions}`);
              if (getShellResult && getShellResult.code === 0) {
                markdown.appendMarkdown(`# get ${resourceTypeName} ${getOptions}`);
                markdown.appendMarkdown('\n___\n');
                markdown.appendCodeblock(getShellResult.stdout, 'plaintext');
                markdown.appendMarkdown('\n___\n');
              }
            } else {
              const explainShellResult = await this.kubectlApi?.invokeCommand(`explain ${resourceTypeName}`);
              if (explainShellResult && explainShellResult.code === 0) {
                markdown.appendMarkdown(`# Explain ${resourceTypeName}`);
                markdown.appendMarkdown('\n___\n');
                markdown.appendText(explainShellResult.stdout);
                markdown.appendMarkdown('\n___\n');
              }
            }
            resolve(markdown);
            return;
          }
          reject(markdown);
        }
      })();
    });
  }

  async switchNamespace() {
    const namespacesShellResult = await this.kubectlApi?.invokeCommand(`get namespaces --no-headers -o custom-columns=":metadata.name"`);
    if (namespacesShellResult) {
      if (namespacesShellResult.code === 0) {
        const namespaces = namespacesShellResult.stdout.split(/\r?\n/g).filter(line => line.trim().length > 0);
        const selectedNamespace = await vscode.window.showQuickPick(namespaces);
        if (selectedNamespace) {
          const switchNamespaceShellResult = await this.kubectlApi?.invokeCommand(`config set-context --current --namespace=${selectedNamespace}`); //
          if (switchNamespaceShellResult && switchNamespaceShellResult.code === 0) {
            this.reload();
            try {
              await vscode.commands.executeCommand('extension.vsKubernetesRefreshExplorer');
            } catch (e) {
              //
            }
          }
        }
      }
    }
  }

  next(lineNumber: number) {
    this._goto(lineNumber+1);
  }

  previous(lineNumber: number) {
    this._goto(lineNumber-1);
  }

  private _goto(lineNumber: number) {
    this.kubernetesCommanderTextEditor!.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
  }

  reload() {
    this.rawKubernetesCommanderBuffer = '';
    this.refresh();
  }

  refresh() {
    this.onDidChangeEmitter.fire(this.uri as vscode.Uri);
  }

  settings() {
    vscode.commands.executeCommand('workbench.action.openSettings', `@ext:sandipchitale.vscode-kubernetes-commander`);
  }

  quit() {
    vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }

}
