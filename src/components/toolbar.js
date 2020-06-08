import { CustomElement } from './element.js';
import { __ } from '@converse/headless/i18n';
import { _converse, api, converse } from "@converse/headless/converse-core";
import { html } from 'lit-element';
import { until } from 'lit-html/directives/until.js';

const Strophe = converse.env.Strophe

const i18n_start_call = __('Start a call');
const i18n_show_occupants = __('Show occupants');
const i18n_hide_occupants = __('Hide occupants');
const i18n_chars_remaining = __('Message characters remaining');
const i18n_choose_file =  __('Choose a file to send')


export class ChatToolbar extends CustomElement {

    static get properties () {
        return {
            model: { type: Object },
            hidden_occupants: { type: Boolean },
            is_groupchat: { type: Boolean },
            message_limit: { type: Number },
            show_call_button: { type: Boolean },
            show_occupants_toggle: { type: Boolean },
            show_spoiler_button: { type: Boolean },
        }
    }

    render () {
        return html`${until(this.getButtons(), '')}`
    }

    async getButtons () {
        const buttons = [];
        if (this.show_call_button) {
            buttons.push(html`
                <button class="toggle-call" @click=${this.toggleCall} title="${i18n_start_call}">
                    <fa-icon class="fa fa-phone" path-prefix="/dist" color="var(--text-color-lighten-15-percent)" size="1em"></fa-icon>
                </button>`
            );
        }
        if (this.show_occupants_toggle) {
            buttons.push(html`
                <button class="toggle_occupants"
                        title="${this.hidden_occupants ? i18n_show_occupants : i18n_hide_occupants}"
                        @click=${this.toggleOccupants}>
                    <fa-icon class="${this.hidden_occupants ? `fa-angle-double-left` : `fa-angle-double-right`}"
                             path-prefix="/dist" color="var(--text-color-lighten-15-percent)" size="1em"></fa-icon>
                </button>`
            );
        }
        const message_limit = api.settings.get('message_limit');
        if (message_limit) {
            buttons.push(html`<span class="message-limit" title="${i18n_chars_remaining}">${this.message_limit}</span>`);
        }

        if (this.show_spoiler_button) {
            let i18n_toggle_spoiler;
            if (this.model.get('composing_spoiler')) {
                i18n_toggle_spoiler = __("Click to write as a normal (non-spoiler) message");
            } else {
                i18n_toggle_spoiler = __("Click to write your message as a spoiler");
            }
            buttons.push(html`
                <button class="toggle-compose-spoiler"
                        title="${i18n_toggle_spoiler}"
                        @click=${this.toggleComposeSpoilerMessage}>
                    <fa-icon class="${this.composing_spoiler ? 'fa fa}eye-slash' : 'fa-eye'}"
                             path-prefix="/dist"
                             color="var(--text-color-lighten-15-percent)"
                             size="1em"></fa-icon>
                </button>`
            );
        }

        if (await api.disco.supports(Strophe.NS.HTTPUPLOAD, _converse.domain)) {
            buttons.push(html`
                <li class="upload-file" @click=${this.toggleFileUpload}>
                    <a class="fa fa-paperclip" title="${i18n_choose_file}"></a>
                    <input type="file" @change=${this.onFileSelection} class="fileupload" multiple="" style="display:none"/>
                </li>
            `);
        }
        /**
         * *Hook* which allows plugins to add more buttons to a chat's toolbar
         * @event _converse#getToolbarButtons
         */
        return _converse.api.hook('getToolbarButtons', this, buttons);
    }

    toggleFileUpload () {
        this.querySelector('input.fileupload').click();
    }

    onFileSelection (evt) {
        this.model.sendFiles(evt.target.files);
    }

    toggleComposeSpoilerMessage () {
        this.model.set('composing_spoiler', !this.model.get('composing_spoiler'));
    }

    toggleOccupants (ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        this.model.save({'hidden_occupants': !this.model.get('hidden_occupants')});
    }

    toggleCall (ev) {
        ev.stopPropagation();
        /**
         * When a call button (i.e. with class .toggle-call) on a chatbox has been clicked.
         * @event _converse#callButtonClicked
         * @type { object }
         * @property { Strophe.Connection } _converse.connection - The XMPP Connection object
         * @property { _converse.ChatBox | _converse.ChatRoom } _converse.connection - The XMPP Connection object
         * @example _converse.api.listen.on('callButtonClicked', (connection, model) => { ... });
         */
        api.trigger('callButtonClicked', {
            connection: _converse.connection,
            model: this.model
        });
    }
}

window.customElements.define('converse-chat-toolbar', ChatToolbar);
