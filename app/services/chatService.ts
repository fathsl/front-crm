import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc, where, writeBatch } from "firebase/firestore";
import { db, storage } from "./firebase";
import { deleteObject, ref } from "firebase/storage";

export class ChatService {
  static async createOrGetChat(user1Id: number, user2Id: number): Promise<string> {
    const [user1, user2] = [user1Id, user2Id].sort();
    const chatId = `${user1}_${user2}`;
    
    try {
      // Check if chat already exists
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user1, user2],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          participantNames: {}
        });
      }
      
      return chatId;
    } catch (error) {
      console.error('Error creating/accessing chat:', error);
      throw error;
    }
  }
      
  static async getChatHistory(chatId: string, lastDoc = null, limitCount = 20) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      let q = query(
        messagesRef, 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      );
      
      if (lastDoc) {
        q = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      }
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      return {
        messages: messages.reverse(),
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }
      
  static subscribeToUserChats(userId: string, callback: (chats: any[]) => void) {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastMessageAt: doc.data().lastMessageAt?.toDate()
          }));
          callback(chats);
        },
        (error) => {
          console.error('Error in user chats subscription:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up user chats subscription:', error);
      return () => {}; // Return empty cleanup function
    }
  }
      
      static async markMessagesAsRead(chatId: string, userId: string) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  static subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      return onSnapshot(q, 
        (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          }));
          callback(messages);
        },
        (error) => {
          console.error('Error in messages subscription:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up messages subscription:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  static async sendTextMessage(chatId: string, message: {
    senderId: string;
    receiverId: string;
    text: string;
  }) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageData = {
        ...message,
        messageType: 'text',
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent'
      };
      
      await addDoc(messagesRef, messageData);
      
      // Update last message in chat
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: message.text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: message.senderId
      });
      
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }

  static async sendVoiceMessage(chatId: string, message: {
    senderId: string;
    receiverId: string;
    audioUrl: string;
    duration: number;
  }) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageData = {
        ...message,
        messageType: 'voice',
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent'
      };
      
      await addDoc(messagesRef, messageData);
      
      // Update last message in chat
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: 'Voice message',
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: message.senderId
      });
      
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  }
      
  static async deleteVoiceMessage(audioPath: string) {
    try {
      const audioRef = ref(storage, audioPath);
      await deleteObject(audioRef);
    } catch (error) {
      console.error('Error deleting voice message:', error);
      throw error;
    }
  }
      
  static async searchMessages(chatId: string, searchTerm: string) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('messageType', '==', 'text'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
          text: doc.data().text
        }))
        .filter(msg => 
          msg.text && msg.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return messages;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}