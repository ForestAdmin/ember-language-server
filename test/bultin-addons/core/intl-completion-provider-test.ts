import { MessageConnection } from 'vscode-jsonrpc';
import { CompletionRequest } from 'vscode-languageserver-protocol';
import { createServer, ServerBucket, getResult, makeProject } from '../../test_helpers/public-integration-helpers';

const testCaseAsyncFsOptions = [false, true];
const translations = {
  'en-us.json': `{
    "rootFileTranslation": "text 1"
  }`,
  'sub-folder': {
    'en-us.json': `{
      "subFolderTranslation": {
        "subTranslation": "text 2",
        "anotherTranslation": "another text"
      }
    }`,
  },
};

for (const asyncFsEnabled of testCaseAsyncFsOptions) {
  describe(`Intl - async fs enabled: ${asyncFsEnabled.toString()}`, function () {
    let instance!: ServerBucket;
    let connection!: MessageConnection;

    beforeAll(async () => {
      instance = await createServer({ asyncFsEnabled: asyncFsEnabled });
      connection = instance.connection;
    });

    afterAll(async () => {
      await instance.destroy();
    });

    describe('empty autocomplete', () => {
      it('should not autocomplete if no data', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.hbs': '',
                  },
                },
                translations,
              },
              'app/components/test.hbs',
              { line: 0, character: 0 }
            )
          ).response
        ).toEqual([]);
      });

      it('should not autocomplete if `els-intl-addon` installed', async () => {
        const files = makeProject(
          {
            app: {
              components: {
                'test.hbs': '{{t "rootFileTransla" }}',
              },
            },
            translations,
          },
          {
            'els-intl-addon': {
              'package.json': JSON.stringify({
                name: 'els-intl-addon',
                'ember-language-server': {
                  capabilities: {
                    completionProvider: true,
                  },
                },
              }),
            },
          }
        );

        expect((await getResult(CompletionRequest.method, connection, files, 'app/components/test.hbs', { line: 0, character: 19 })).response).toEqual([]);
      });
    });

    describe('provide completion', () => {
      it('should autocomplete root translation in handlebars', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.hbs': '{{t "rootFileTransla" }}',
                  },
                },
                translations,
              },
              'app/components/test.hbs',
              { line: 0, character: 19 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : text 1',
            kind: 12,
            label: 'rootFileTranslation',
            textEdit: {
              newText: 'rootFileTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
        ]);
      });

      it('should respect placeholder position in handlebars', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.hbs': '{{t "rootFileTransla" }}',
                  },
                },
                translations,
              },
              'app/components/test.hbs',
              { line: 0, character: 12 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : text 1',
            kind: 12,
            label: 'rootFileTranslation',
            textEdit: {
              newText: 'rootFileTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
        ]);
      });

      it('should autocomplete sub folder translation in handlebars', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.hbs': `{{t "subFolderTranslat" }}`,
                  },
                },
                translations,
              },
              'app/components/test.hbs',
              { line: 0, character: 12 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : text 2',
            kind: 12,
            label: 'subFolderTranslation.subTranslation',
            textEdit: {
              newText: 'subFolderTranslation.subTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
          {
            detail: 'en-us : another text',
            kind: 12,
            label: 'subFolderTranslation.anotherTranslation',
            textEdit: {
              newText: 'subFolderTranslation.anotherTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
        ]);
      });

      it('should autocomplete in JS files when in the end of expression', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.js': 'export default class Foo extends Bar { text = this.intl.t("subFolderTranslation.another"); }',
                  },
                },
                translations,
              },
              'app/components/test.js',
              { line: 0, character: 86 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : another text',
            kind: 12,
            label: 'subFolderTranslation.anotherTranslation',
            textEdit: {
              newText: 'subFolderTranslation.anotherTranslation',
              range: {
                end: {
                  character: 59,
                  line: 0,
                },
                start: {
                  character: 59,
                  line: 0,
                },
              },
            },
          },
        ]);
      });

      it('should autocomplete sub folder translation in JS', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.js': `export default class Foo extends Bar { text = this.intl.t("subFolderTranslation."); }`,
                  },
                },
                translations,
              },
              'app/components/test.js',
              { line: 0, character: 64 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : text 2',
            kind: 12,
            label: 'subFolderTranslation.subTranslation',
            textEdit: {
              newText: 'subFolderTranslation.subTranslation',
              range: {
                end: {
                  character: 59,
                  line: 0,
                },
                start: {
                  character: 59,
                  line: 0,
                },
              },
            },
          },
          {
            detail: 'en-us : another text',
            kind: 12,
            label: 'subFolderTranslation.anotherTranslation',
            textEdit: {
              newText: 'subFolderTranslation.anotherTranslation',
              range: {
                end: {
                  character: 59,
                  line: 0,
                },
                start: {
                  character: 59,
                  line: 0,
                },
              },
            },
          },
        ]);
      });
    });

    describe('provide completion - YAML', () => {
      it('should autocomplete root translation in handlebars', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.hbs': '{{t "rootFileTransla"}}',
                  },
                },
                translations: {
                  'en-us.yaml': `rootFileTranslation: text 1`,
                  'sub-folder': {
                    'en-us.yaml': `subFolderTranslation:
                        subTranslation: text 2
                        anotherTranslation: another text
                      `,
                  },
                },
              },
              'app/components/test.hbs',
              { line: 0, character: 20 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : text 1',
            kind: 12,
            label: 'rootFileTranslation',
            textEdit: {
              newText: 'rootFileTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
        ]);
      });

      it('should autocomplete sub folder translation in handlebars', async () => {
        expect(
          (
            await getResult(
              CompletionRequest.method,
              connection,
              {
                app: {
                  components: {
                    'test.hbs': '{{t "subFolderTranslat"}}',
                  },
                },
                translations: {
                  'en-us.yaml': `rootFileTranslation: text 1`,
                  'sub-folder': {
                    'en-us.yaml': `subFolderTranslation:
                        subTranslation: text 2
                        anotherTranslation: another text
                      `,
                  },
                },
              },
              'app/components/test.hbs',
              { line: 0, character: 22 }
            )
          ).response
        ).toEqual([
          {
            detail: 'en-us : text 2',
            kind: 12,
            label: 'subFolderTranslation.subTranslation',
            textEdit: {
              newText: 'subFolderTranslation.subTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
          {
            detail: 'en-us : another text',
            kind: 12,
            label: 'subFolderTranslation.anotherTranslation',
            textEdit: {
              newText: 'subFolderTranslation.anotherTranslation',
              range: {
                end: {
                  character: 5,
                  line: 0,
                },
                start: {
                  character: 5,
                  line: 0,
                },
              },
            },
          },
        ]);
      });
    });
  });
}