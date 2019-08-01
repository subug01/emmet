import { AbbreviationNode, Value } from '@emmetio/abbreviation';
import { pushString } from '../../output-stream';
import { CommentOptions } from '../../types';
import { HTMLWalkState } from './html';
import { WalkState } from './walk';
import { pushTokens } from './utils';
import template, { TemplateToken } from './template';

export interface CommentWalkState {
    enabled: boolean;
    trigger: string[];
    before?: TemplateToken[];
    after?: TemplateToken[];
}

export function createCommentState(options: CommentOptions): CommentWalkState {
    return {
        ...options,
        before: options.before ? template(options.before) : void 0,
        after: options.after ? template(options.after) : void 0
    };
}

/**
 * Adds comment prefix for given node, if required
 */
export function commentNodeBefore(node: AbbreviationNode, state: HTMLWalkState) {
    if (shouldComment(node, state) && state.comment.before) {
        output(node, state.comment.before, state);
    }
}

/**
 * Adds comment suffix for given node, if required
 */
export function commentNodeAfter(node: AbbreviationNode, state: HTMLWalkState) {
    if (shouldComment(node, state) && state.comment.after) {
        output(node, state.comment.after, state);
    }
}

/**
 * Check if given node should be commented
 */
function shouldComment(node: AbbreviationNode, state: HTMLWalkState): boolean {
    const { comment } = state;

    if (!comment.enabled || !comment.trigger || !node.name || !node.attributes) {
        return false;
    }

    for (const attr of node.attributes) {
        if (attr.name && comment.trigger.includes(attr.name)) {
            return true;
        }
    }

    return false;
}

/**
 * Pushes given template tokens into output stream
 */
function output(node: AbbreviationNode, tokens: TemplateToken[], state: WalkState) {
    const attrs: { [name: string]: Value[] } = {};
    const { out } = state;

    // Collect attributes payload
    for (const attr of node.attributes!) {
        if (attr.name && attr.value) {
            attrs[attr.name.toUpperCase()] = attr.value;
        }
    }

    // Output parsed tokens
    for (const token of tokens) {
        if (typeof token === 'string') {
            pushString(out, token);
        } else if (attrs[token.name]) {
            pushString(out, token.before);
            pushTokens(attrs[token.name], state);
            pushString(out, token.after);
        }
    }
}
