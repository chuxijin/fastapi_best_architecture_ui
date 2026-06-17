import type { PMNode } from '@HaloEditor/tiptap';

import {
  Decoration,
  DecorationSet,
  EditorView,
  Plugin,
  PluginKey,
  Selection,
  Transaction,
} from '@HaloEditor/tiptap/pm';
import { Editor } from '@HaloEditor/tiptap/vue-3';
import scrollIntoView from 'scroll-into-view-if-needed';
export interface SearchAndReplacePluginProps {
  editor: Editor;
  element: HTMLElement;
  searchResultClass?: string;
  findSearchClass?: string;
}

export const searchAndReplacePluginKey =
  new PluginKey<SearchAndReplacePluginState>('searchAndReplace');

export type SearchAndReplacePluginViewProps = SearchAndReplacePluginProps & {
  view: EditorView;
};

export class SearchAndReplacePluginView {
  public containerElement: HTMLElement;

  public editor: Editor;

  public init: boolean;

  public view: EditorView;

  constructor({ view, editor, element }: SearchAndReplacePluginViewProps) {
    this.editor = editor;
    this.view = view;
    this.containerElement = element;
    this.init = false;
  }

  destroy() {
    return false;
  }

  update() {
    const headerParentElement = this.findEditorEntryElement();
    if (!this.init && headerParentElement) {
      headerParentElement.insertAdjacentElement(
        'afterbegin',
        this.containerElement,
      );
      this.init = true;
    }
    return false;
  }

  private findEditorEntryElement() {
    const editorElement = this.editor.options.element as HTMLElement;
    let currentElement = editorElement;
    while (currentElement) {
      if (currentElement.classList.contains('editor-main')) {
        return currentElement;
      }

      if (!currentElement.parentElement) {
        break;
      }
      currentElement = currentElement.parentElement;
    }
    return null;
  }
}

export interface TextNodesWithPosition {
  text: string;
  pos: number;
  index: number;
}

export interface SearchResultWithPosition {
  pos: number;
  index: number;
  from: number;
  to: number;
}

export class SearchAndReplacePluginState {
  public caseSensitive: boolean;
  public editor: Editor;
  public enable: boolean;
  public findCount: number;
  public findIndexDecoration: Decoration | undefined;
  // Whether it is necessary to reset the findIndex based on the cursor position.
  public findIndexFlag: boolean;
  public regex: boolean;
  public replaceTerm: string;
  public results: SearchResultWithPosition[] = [];
  public searchResultDecorations: Decoration[] = [];
  public searchTerm: string;
  public wholeWord: boolean;
  get findIndex() {
    return this._findIndex;
  }

  set findIndex(newValue) {
    this._findIndex = this.verifySetIndex(newValue);
  }

  private _findIndex: number;

  constructor({
    editor,
    enable,
    regex,
    caseSensitive,
    wholeWord,
  }: {
    caseSensitive?: boolean;
    editor: Editor;
    enable?: boolean;
    regex?: boolean;
    wholeWord?: boolean;
  }) {
    this.editor = editor;
    this.enable = enable || false;
    this.searchTerm = '';
    this.replaceTerm = '';
    this.regex = regex || false;
    this.caseSensitive = caseSensitive || false;
    this.wholeWord = wholeWord || false;
    this._findIndex = 0;
    this.findCount = 0;
    this.searchResultDecorations = [];
    this.findIndexDecoration = undefined;
    this.results = [];
    this.findIndexFlag = true;
  }

  apply(tr: Transaction): SearchAndReplacePluginState {
    const action = tr.getMeta(searchAndReplacePluginKey);

    if (action && 'setEnable' in action) {
      if (action.setEnable && !this.enable) {
        action.setSearchTerm = this.searchTerm;
      }
      this.enable = action.setEnable;
    }

    if (!this.enable) {
      return this;
    }

    // The refresh method needs to be called before setFindIndex
    // Because setFindIndex depends on the refreshed results
    if (action && action.refresh) {
      this.processSearches(tr);
    }

    if (action && 'setReplaceTerm' in action) {
      this.replaceTerm = action.setReplaceTerm;
    }

    if (action && 'setFindIndex' in action) {
      const { setFindIndex } = action;
      this.findIndex = setFindIndex;
      this.processFindIndexDecoration();
    }

    if (action && 'setScrollView') {
      this.scrollIntoFindIndexView();
    }

    if (action && 'setRegex' in action && this.regex !== action.setRegex) {
      this.regex = action.setRegex;
      action.setSearchTerm = this.searchTerm;
    }

    if (
      action &&
      'setWholeWord' in action &&
      this.wholeWord !== action.setWholeWord
    ) {
      this.wholeWord = action.setWholeWord;
      action.setSearchTerm = this.searchTerm;
    }

    if (
      action &&
      'setCaseSensitive' in action &&
      this.caseSensitive !== action.setCaseSensitive
    ) {
      this.caseSensitive = action.setCaseSensitive;
      action.setSearchTerm = this.searchTerm;
    }

    if (action && 'setSearchTerm' in action) {
      this.searchTerm = action.setSearchTerm;
      this.findIndexFlag = true;
      // If the searchTerm is modified or replaced, perform a new
      // search throughout the entire document.
      this.processSearches(tr);
      this.scrollIntoFindIndexView();
      return this;
    }

    if (tr.docChanged) {
      return this.processSearches(tr);
    } else if (tr.getMeta('pointer')) {
      this.getNearestResultBySelection(tr.selection);
      this.processFindIndexDecoration();
    }

    return this;
  }

  /**
   * Convert the entire text into flattened text with positions.
   *
   * @param doc The entire document
   * @returns Flattened text with positions
   */
  getFullText(doc: PMNode): TextNodesWithPosition[] {
    const textNodesWithPosition: TextNodesWithPosition[] = [];
    doc.descendants((node, pos, _parent, index) => {
      if (node.isText) {
        textNodesWithPosition.push({
          text: `${node.text}`,
          pos,
          index,
        });
      }
    });
    return textNodesWithPosition;
  }

  /**
   * Reset findIndex based on the current cursor position.
   *
   * @param selection Current cursor position.
   */
  getNearestResultBySelection(selection: Selection) {
    const { results } = this;
    for (const [i, result] of results.entries()) {
      if (selection && selection.to <= result.from) {
        this.findIndex = i;
        break;
      }
    }
  }

  /**
   * Get the regular expression object based on the current search term.
   *
   * @returns Regular expression object
   */
  getRegex = (): RegExp => {
    const { searchTerm, regex, caseSensitive, wholeWord } = this;
    let pattern = regex
      ? searchTerm
      : searchTerm.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    if (wholeWord) {
      pattern = String.raw`\b${pattern}\b`;
    }
    return new RegExp(pattern, caseSensitive ? 'gu' : 'gui');
  };

  /**
   * Highlight the current result based on findIndex.
   *
   * @memberof SearchAndReplacePluginState
   */
  processFindIndexDecoration() {
    const { results, findIndex } = this;
    const result = results[findIndex];
    if (result) {
      this.findIndexDecoration = Decoration.inline(result.from, result.to, {
        class: 'search-result-current',
      });
    }
  }

  /**
   * Generate highlighted results based on the 'results'.
   *
   * @memberof SearchAndReplacePluginState
   */
  processResultDecorations() {
    const { results } = this;
    this.findCount = results.length;
    this.searchResultDecorations.length = 0;
    for (const result of results) {
      this.searchResultDecorations.push(
        Decoration.inline(result.from, result.to, {
          class: 'search-result',
        }),
      );
    }
  }

  /**
   * Execute full-text search functionality.
   *
   * @param Transaction
   * @returns
   * @memberof SearchAndReplacePluginState
   */
  processSearches({
    doc,
    selection,
  }: Transaction): SearchAndReplacePluginState {
    const textNodesWithPosition = this.getFullText(doc);
    const searchTerm = this.getRegex();
    this.results.length = 0;
    for (const { text, pos, index } of textNodesWithPosition) {
      const matches = [...text.matchAll(searchTerm)].filter(([matchText]) =>
        matchText.trim(),
      );

      for (const m of matches) {
        if (m[0] === '') {
          break;
        }

        if (m.index !== undefined) {
          this.results.push({
            pos,
            index,
            from: pos + m.index,
            to: pos + m.index + m[0].length,
          });
        }
      }
    }

    this.processResultDecorations();
    if (this.findIndexFlag) {
      this.getNearestResultBySelection(selection);
      this.findIndexFlag = false;
    }
    this.processFindIndexDecoration();
    return this;
  }

  scrollIntoFindIndexView() {
    const { results, editor, _findIndex } = this;
    if (results.length > _findIndex && _findIndex >= 0) {
      const result = results[_findIndex];
      if (result) {
        const { pos } = result;
        const { view } = editor;
        let node = view.nodeDOM(pos - 1);
        if (!(node instanceof HTMLElement)) {
          node = view.domAtPos(pos, 0).node;
        }
        if (node instanceof HTMLElement) {
          scrollIntoView(node, {
            behavior: 'smooth',
            scrollMode: 'if-needed',
          });
        }
      }
    }
  }

  /**
   * Validate if findIndex is within the range
   * If results.length === 0, take 0
   * If less than or equal to -1, take results.length - 1
   * If greater than results.length - 1, take 0
   *
   * @param index new findIndex
   * @returns validated findIndex
   */
  verifySetIndex(index: number) {
    const { results } = this;
    if (results.length === 0) {
      return 0;
    } else if (index <= -1) {
      return results.length - 1;
    } else if (index > results.length - 1) {
      return 0;
    } else {
      return index;
    }
  }
}

export const SearchAndReplacePlugin = (
  options: SearchAndReplacePluginProps,
) => {
  return new Plugin({
    key: searchAndReplacePluginKey,
    view: (view) => new SearchAndReplacePluginView({ view, ...options }),
    state: {
      init: () => {
        return new SearchAndReplacePluginState({ ...options });
      },
      apply: (tr, prev) => {
        return prev.apply(tr);
      },
    },
    props: {
      decorations: (state) => {
        const searchAndReplaceState = searchAndReplacePluginKey.getState(state);
        if (searchAndReplaceState) {
          const { searchResultDecorations, findIndexDecoration, enable } =
            searchAndReplaceState;
          if (!enable) {
            return DecorationSet.empty;
          }
          const decorations = [...searchResultDecorations];
          if (findIndexDecoration) {
            decorations.push(findIndexDecoration);
          }
          if (decorations.length > 0) {
            return DecorationSet.create(state.doc, decorations);
          }
        }
        return DecorationSet.empty;
      },
    },
  });
};
