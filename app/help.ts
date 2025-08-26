export interface User {
  userId: number;
  kullaniciAdi: string;
  firstName: string;
  lastName: string;
  email: string;
  telefon: string;
  password?: string;
  durum: string;
  yetkiTuru: Role;
  fullName?: string;
  loginTime?: number;
}

export enum Role {
    Yonetici,
    Temsilci,
    Muhasebe,
    Fabrika,
    Logistik,
    Gozlemci,
}

export interface Project {
    id : number;
    title: string;
    details: string;
    createdByUserId : number;
    updatedByUserId : number;
    createdAt : Date;
    updatedAt : Date;
    status : ProjectStatus;
    startDate : Date;
    endDate : Date;
    EstimationTime  : string;
}

export enum ProjectStatus {
    NotStarted,
    InProgress,
    OnHold,
    Completed
}

export interface Task {
    id : number;
    title: string;
    description: string;
    priority: number;
    status: Status;
    DueDate : Date;
    estimatedTime : string;
    SortOrder : number;
    createdByUserId : number;
    updatedByUserId : number;
    createdAt : Date;
    updatedAt : Date;
    assignedUsers : User[];
}

export enum Status {
    Backlog,
    ToDo,
    InProgress,
    InReview,
    Done
}

export interface TaskAssignments {
    id : number;
    taskId : number;
    userId : number;
    assignedAt : string;
    taskTitle : string;
    userName : string;
    userUsername : string;
    userEmail : string;
}

export interface Activity {
    id: string;
    title: string;
    time: string;
    icon: React.ElementType;
    bgColor: string;
    iconColor: string;
}

export interface StatCard {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ElementType;
    bgColor: string;
    iconColor: string;
}

export interface ProductCategoryDto {
    categoryName: string;
    stock: number;
  }
  
export interface ComponentDto {
    componentId: number;
    componentName: string;
    stock: number;
  }
  
export interface CustomerPurchase {
    customerName: string;
    totalQuantity: number;
  }
  
export interface CountryDelivery {
    countryName: string;
    totalQuantity: number;
  }
  
export interface RegionDelivery {
    region: string;
    totalQuantity: number;
  }
  
export interface CustomerDto {
    customerName: string;
    phone: string;
    email: string;
    vatNumber: string;
    address: string;
    countryName: string;
    region: string;
  }
  
export interface OrderDto {
    orderId: number;
    orderNumber: string;
    customerName: string;
    country: string;
    totalPrice: number;
    depositPrice: number;
    remainingBalance: number;
    advancePercentage: number;
    deliveryType: string;
    currencyType: string;
    paymentStatus: string;
    orderType: string;
    orderDate: string;
  }
  
export interface ReportingData {
    productCategories: ProductCategoryDto[];
    components: ComponentDto[];
    customerPurchases: CustomerPurchase[];
    countryDeliveries: CountryDelivery[];
    regionDeliveries: RegionDelivery[];
    customers: CustomerDto[];
    orders: OrderDto[];
    filterOptions: FilterOptions | null;
  }

export interface OrderFilterDto {
    orderNumber?: string;
    customerName?: string;
    userId?: number;
    country?: string;
    paymentStatus?: string;
    processStatus?: string;
    deliveryDateStart?: Date;
    deliveryDateEnd?: Date;
  }
  
export interface FilteredOrderDto {
    number: string;
    customerName: string;
    country: string;
    user: string;
    stage: string;
    control: string;
    totalPrice: number;
    depositPrice: number;
    remainingBalance: number;
    advancePercentage: number;
    deliveryType: string;
    currencyType: string;
    paymentStatus: string;
    orderDate: Date | null;
    productionDate: Date | null;
  }
  
export interface FilterOptions {
    customers: Array<{ Id: number; Name: string }>;
    countries: string[];
    users: Array<{ Id: number; Name: string }>;
    paymentStatuses: string[];
    processStatuses: string[];
    orders: FilteredOrderDto[];
  }

export interface Document {
    id: number;
    fileName: string;
    originalFileName: string;
    fileSize?: number;
    mimeType?: string;
    filePath?: string;
    uploadedAt?: Date;
}

export interface Message {
    id: number;
    senderId: number;
    text?: string;
    audioUrl?: string;
    messageType: MessageType;
    timestamp: any;
    duration?: number;
    senderName?: string;
    isEdited?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    senderUsername?: string;
    content?: string;
    documentId?: number;
    document?: Document;
    fileReference?: string;
}

export interface Chat {
    id: number;
    participants: number[];
    lastMessage: string;
    lastMessageAt: Date;
    lastMessageSenderId: number;
    unreadCount: number;
    user: User;
}

export interface Client {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    details: string;
    country: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy : number;
    updatedBy : number;
}

export interface CreateDiscussionRequest {
    title: string;
    description: string;
    createdByUserId: number;
    participantUserIds: number[];
}

export enum MessageType {
    Text,
    Voice,
    File
}

export interface SendMessageRequest {
    discussionId: number;
    senderId: number;
    receiverId: number;
    content: string;
    messageType: MessageType;
}

export interface CreateMessageRequest {
    discussionId: number;
    senderId: number;
    receiverId: number;
    content: string;
    messageType: MessageType;
}

export interface Discussion {
    id: number;
    title: string;
    description: string;
    createdByUserId: number;
    participantUserIds: number[];
    createdAt : Date;
    updatedAt : Date;
}