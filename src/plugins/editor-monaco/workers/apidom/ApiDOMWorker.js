/* eslint-disable no-underscore-dangle */
// eslint-disable-next-line max-classes-per-file
import * as vscodeLanguageServerTextDocument from 'vscode-languageserver-textdocument'; // this is true source
import * as apidomLS from '@swagger-api/apidom-ls';

class AsyncRefHoverProvider {
  /*
  returning `true` skips execution of any subsequent defined providers
   */
  // eslint-disable-next-line class-methods-use-this
  break() {
    return false;
  }

  /*
  optional, if returning `ProviderMode.REF` only `doRefCompletion` function will be executed for each found ref element
  if not implemented or returning `ProviderMode.REF`, only `doCompletion` will be called once for the whole doc
   */
  // eslint-disable-next-line class-methods-use-this
  providerMode() {
    return 1;
  }

  /*
   optional
   */

  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars,no-unused-vars
  configure(settings) {}

  /*
  method called only for hover triggered within a $ref value, if providerMode() returns ProviderMode.REF.
  In this case method `doHover` is NOT invoked.
  it is expected to return an array of content lines, and a `mergeStrategy` to integrate into items resolved by
  hover service and/or other providers.
   */
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  async doRefHover(
    /*
     the whole document, get content with `textDocument.getText()`
     see https://github.com/microsoft/vscode-languageserver-node/blob/main/textDocument/src/main.ts#L116=
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    textDocument,
    /*
      the position of cursor
    */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    position,
    /*
     the apidom element holding the ref
    */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    element,
    /*
     the whole parsed doc as ApiDOM root element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    api,
    /*
     the content of `$ref` as string
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    refValue,
    /*
     hover lines related to this ref processed so far
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
    currentHoverItems
  ) {
    console.log(element.toValue(), refValue);
    // build completions
    const refs = await this.legacyRefsHover(refValue);
    if (refs.length === 0) {
      return {
        mergeStrategy: apidomLS.MergeStrategy.IGNORE,
        hoverContent: [],
      };
    }
    return {
      mergeStrategy: apidomLS.MergeStrategy.APPEND,
      hoverContent: refs,
    };
  }

  /*
  mandatory, name
   */
  // eslint-disable-next-line class-methods-use-this
  name() {
    return 'HoverRefProvider';
  }

  /*
    mandatory, the array of ns/version pairs supported
   */
  // eslint-disable-next-line class-methods-use-this
  namespaces() {
    return [
      {
        namespace: 'openapi',
        version: '3.1.0',
      },
      {
        namespace: 'asyncapi',
        version: '2.1.0',
      },
      {
        namespace: 'asyncapi',
        version: '2.2.0',
      },
      {
        namespace: 'asyncapi',
        version: '2.3.0',
      },
      {
        namespace: 'asyncapi',
        version: '2.4.0',
      },
      {
        namespace: 'asyncapi',
        version: '2.5.0',
      },
    ];
  }

  /*
   Mocks
   */

  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  async legacyRefsHover(ref) {
    // logic here to get possible refs to add to hover items
    const result = [];
    if (ref.startsWith('http') && ref.includes('domain')) {
      result.push(ref.replace('domain', 'updatedDomainURL'));
    }
    return result;
  }
}

export class ApiDOMWorker {
  static refCompletionProvider = new AsyncRefHoverProvider();

  static apiDOMContext = {
    validatorProviders: [],
    completionProviders: [],
    hoverProviders: [this.refCompletionProvider],
    performanceLogs: false,
    logLevel: apidomLS.LogLevel.WARN,
    defaultLanguageContent: {
      namespace: 'asyncapi',
    },
  };

  constructor(ctx, createData) {
    this._ctx = ctx;
    this._createData = createData;
    this._languageService = apidomLS.getLanguageService(this.constructor.apiDOMContext);
  }

  async doValidation(uri) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.doValidation(document);
  }

  async doComplete(uri, position) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.doCompletion(document, position);
  }

  async doHover(uri, position) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.doHover(document, position);
  }

  async findDocumentSymbols(uri) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.doFindDocumentSymbols(document);
  }

  async provideDefinition(uri, position) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.doProvideDefinition(document, {
      uri,
      position,
    });
  }

  async doCodeActions(uri, diagnostics) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.doCodeActions(document, diagnostics);
  }

  async findSemanticTokens(uri) {
    const document = this._getTextDocument(uri);
    if (!document) {
      return [];
    }
    return this._languageService.computeSemanticTokens(document);
  }

  async getSemanticTokensLegend() {
    return this._languageService.getSemanticTokensLegend();
  }

  _getTextDocument(uri) {
    const models = this._ctx.getMirrorModels()[0];
    /**
     * When there are multiple files open, this will be an array
     * expect models: _lines[], _uri, _versionId
     * expect models.uri.toString() to be singular, e.g. inmemory://model/1
     * thus, before returning a TextDocument, we can optionally
     * validate that models.uri.toString() === uri
     * fyi, reference more complete example in cssWorker
     * https://github.com/microsoft/monaco-css/blob/master/src/cssWorker.ts
     * which we might want later to handle multiple URIs.
     */

    return vscodeLanguageServerTextDocument.TextDocument.create(
      uri,
      this._createData.languageId,
      models._versionId,
      models.getValue()
    );
  }
}

export const makeCreate = (BaseClass) => (ctx, createData) => {
  let ApiDOMWorkerClass = BaseClass;

  if (createData.customWorkerPath) {
    if (typeof globalThis.importScripts === 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(
        'Monaco is not using webworkers for background tasks, and that is needed to support the customWorkerPath flag'
      );
    } else {
      if (Array.isArray(createData.customWorkerPath)) {
        globalThis.importScripts(...createData.customWorkerPath);
      } else {
        globalThis.importScripts(createData.customWorkerPath);
      }

      const { customApiDOMWorkerFactory: workerFactoryFunc } = globalThis;
      if (typeof workerFactoryFunc !== 'function') {
        throw new Error(
          `The script at ${createData.customWorkerPath} does not add customApiDOMWorkerFactory to globalThis`
        );
      }

      ApiDOMWorkerClass = workerFactoryFunc(ApiDOMWorkerClass, {
        apidomLS,
        vscodeLanguageServerTextDocument,
      });
    }
  }

  return new ApiDOMWorkerClass(ctx, createData);
};
