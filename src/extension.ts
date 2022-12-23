import * as vscode from 'vscode';

import { KubernetesCommanderDocumentContentProvider } from './KubernetesCommanderDocumentContentProvider';

export function activate({ subscriptions }: vscode.ExtensionContext) {
  // register a content provider for the kubernetes-commander
  const kubernetesCommanderSchemeProvider = new KubernetesCommanderDocumentContentProvider();
  subscriptions.push(kubernetesCommanderSchemeProvider);
  subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      KubernetesCommanderDocumentContentProvider.KUBERNETES_COMMANDER,
      kubernetesCommanderSchemeProvider
    )
  );

  // register a command that opens kubernetes commander buffer
  subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-kubernetes-commander.show',
      () => {
        kubernetesCommanderSchemeProvider.open(KubernetesCommanderDocumentContentProvider.KUBERNETES_COMMANDER);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.edit-kubeconfig',
      (editor) => {
        kubernetesCommanderSchemeProvider.editKubeConfig();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.describe',
      (editor) => {
        kubernetesCommanderSchemeProvider.describe(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.describeAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.describeAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.describeSpecific',
      (editor) => {
        kubernetesCommanderSchemeProvider.describeSpecific(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.describeSpecificAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.describeSpecificAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.editSpecific',
      (editor) => {
        kubernetesCommanderSchemeProvider.editSpecific(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.editSpecificAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.editSpecificAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.explain',
      (editor) => {
        kubernetesCommanderSchemeProvider.explain(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.get',
      (editor) => {
        kubernetesCommanderSchemeProvider.get(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.getAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.getAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.getSpecific',
      (editor) => {
        kubernetesCommanderSchemeProvider.getSpecific(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.getSpecificAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.getSpecificAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.logSpecificPod',
      (editor) => {
        kubernetesCommanderSchemeProvider.logSpecificPod(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.logSpecificPodAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.logSpecificPodAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.names',
      (editor) => {
        kubernetesCommanderSchemeProvider.names(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.namesAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.namesAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.shellIntoSpecificPod',
      (editor) => {
        kubernetesCommanderSchemeProvider.shellIntoSpecificPod(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.shellIntoSpecificPodAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.shellIntoSpecificPodAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.tailLogSpecificPod',
      (editor) => {
        kubernetesCommanderSchemeProvider.tailLogSpecificPod(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.tailLogSpecificPodAllNamespaces',
      (editor) => {
        kubernetesCommanderSchemeProvider.tailLogSpecificPodAllNamespaces(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.documentation',
      (editor) => {
        kubernetesCommanderSchemeProvider.documentation(editor);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.quit',
      (editor) => {
        kubernetesCommanderSchemeProvider.quit();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.settings',
      (editor) => {
        kubernetesCommanderSchemeProvider.settings();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.reload',
      (editor) => {
        kubernetesCommanderSchemeProvider.reload();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.switch-namespace',
      (editor) => {
        kubernetesCommanderSchemeProvider.switchNamespace();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-kubernetes-commander.node-entropy',
      (editor) => {
        kubernetesCommanderSchemeProvider.nodeEntropy(editor);
      }
    )
  );

  subscriptions.push(
    vscode.languages.registerHoverProvider('kubernetes-commander', {
      provideHover(document, position, token): Thenable<vscode.Hover> {
        return new Promise<vscode.Hover>((resolve, reject) => {
          (async () => {
            resolve(new vscode.Hover(await kubernetesCommanderSchemeProvider.hover(document, position)));
          })();
        });
      }
    })
  );

  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('vscode-kubernetes-commander.resourceTypes') ||
        e.affectsConfiguration('vscode-kubernetes-commander.resourceTypesShowOnly')) {
      kubernetesCommanderSchemeProvider.reload();
    }
  });
}
