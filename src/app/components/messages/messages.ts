import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Moodle } from '../../services/moodle';
import { MoodleUser, MoodleConversation, MoodleMessage } from '../../interfaces/moodle-types';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-messages',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './messages.html',
    styleUrl: './messages.css'
})
export class Messages implements OnInit, AfterViewChecked {
    moodle = inject(Moodle);
    cdr = inject(ChangeDetectorRef);

    currentUser: MoodleUser | null = null;
    conversations: MoodleConversation[] = [];
    selectedConversation: MoodleConversation | null = null;
    messages: MoodleMessage[] = [];
    newMessageText: string = '';

    loadingConversations = true;
    loadingMessages = false;
    sendingMessage = false;

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
    private shouldScrollToBottom = false;

    ngOnInit() {
        this.moodle.getCurrentUser().subscribe(user => {
            this.currentUser = user;
            if (user) {
                this.loadConversations();
            }
        });
    }

    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    loadConversations() {
        if (!this.currentUser) return;
        this.loadingConversations = true;

        this.moodle.getConversations(this.currentUser.id).pipe(
            finalize(() => {
                this.loadingConversations = false;
                this.cdr.detectChanges();
            })
        ).subscribe(convs => {
            this.conversations = convs;
            // Auto-select first if available and desktop? Maybe for later.
        });
    }

    selectConversation(conv: MoodleConversation) {
        this.selectedConversation = conv;
        this.loadMessages(conv.id);
        // In mobile, this might trigger a view change (handled by CSS/template usually or a flag)
    }

    loadMessages(convId: number) {
        if (!this.currentUser) return;
        this.loadingMessages = true;
        this.messages = [];
        this.cdr.detectChanges();

        this.moodle.getConversationMessages(this.currentUser.id, convId).pipe(
            finalize(() => {
                this.loadingMessages = false;
                this.cdr.detectChanges();
                this.shouldScrollToBottom = true;
            })
        ).subscribe(msgs => {
            this.messages = msgs;
        });
    }

    sendMessage() {
        if (!this.newMessageText.trim() || !this.selectedConversation || !this.currentUser) return;

        this.sendingMessage = true;
        const textToSend = this.newMessageText;
        this.newMessageText = ''; // Optimistic clear

        this.moodle.sendMessage(this.selectedConversation.id, textToSend).pipe(
            finalize(() => {
                this.sendingMessage = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: () => {
                // Refresh messages
                this.loadMessages(this.selectedConversation!.id);
            },
            error: (err) => {
                console.error('Send failed', err);
                // Maybe restore text
                this.newMessageText = textToSend;
            }
        });
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    // Helper to get other user info
    getConversationName(conv: MoodleConversation): string {
        if (conv.name) return conv.name;
        // Fallback logic could go here if name is empty
        return 'Chat';
    }

    getConversationImage(conv: MoodleConversation): string {
        if (conv.imageurl) return conv.imageurl;
        // Default avatar
        return 'assets/default-avatar.png'; // Or some placeholder
    }

    backToConversations() {
        this.selectedConversation = null;
    }
}
