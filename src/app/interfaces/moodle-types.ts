export interface MoodleFile {
    filename: string;
    filepath: string;
    filesize: number;
    fileurl: string;
    timemodified: number;
    mimetype: string;
}

export interface MoodleModule {
    id: number;
    url?: string;
    name: string;
    instance: number;
    description?: string;
    visible?: number;
    uservisible?: boolean;
    modicon: string;
    modname: string; // 'assign', 'quiz', 'forum', 'resource', etc.
    modplural: string;
    indent: number;
    contents?: MoodleFile[];
    completion?: number; // 0=none, 1=manual, 2=automatic
    completiondata?: {
        state: number; // 0=incomplete, 1=complete, 2=complete_pass, 3=complete_fail
        timecompleted: number;
        tracking?: number; // 0=none, 1=manual, 2=automatic
    };
}

export interface MoodleSection {
    id: number;
    name: string;
    visible: number;
    summary: string;
    summaryformat: number;
    section: number; // Section number (0, 1, 2...)
    hiddenbynumsections: number;
    uservisible: boolean;
    modules: MoodleModule[];
}

export interface MoodleCourseContent {
    id: number; // Course ID (sometimes returned in structure)
    sections: MoodleSection[];
}

// --- Activities ---

export interface MoodleAssignment {
    id: number;
    cmid: number;
    course: number;
    name: string;
    nosubmissions: number;
    submissiondrafts: number;
    sendnotifications: number;
    sendlatenotifications: number;
    duedate: number;
    allowsubmissionsfromdate: number;
    grade: number;
    timemodified: number;
    completionsubmit: number;
    intro: string;
    introfiles: MoodleFile[];
}

export interface MoodleForum {
    id: number;
    course: number;
    type: string;
    name: string;
    intro: string;
    cmid: number;
    numdiscussions?: number;
}

export interface MoodleDiscussion {
    id: number;
    name: string;
    groupid: number;
    timemodified: number;
    usermodified: number;
    timestart: number;
    timeend: number;
    discussion: number;
    parent: number;
    userid: number;
    created: number;
    modified: number;
    mailed: number;
    subject: string;
    message: string;
    messageformat: number;
    messagetrust: number;
    attachment: string;
    totalscore: number;
    mailnow: number;
    userfullname: string;
    usermodifiedfullname: string;
    userpictureurl: string;
    usermodifiedpictureurl: string;
    numreplies: number;
    numunread: number;
    pinned: boolean;
}

// --- Grades ---

export interface MoodleGradeItem {
    id: number;
    itemname: string;
    itemtype: string; // 'mod', 'course', 'category'
    itemmodule: string; // 'assign', 'quiz'
    iteminstance: number;
    itemnumber: number;
    idnumber: string;
    categoryid: number;
    outcomeid: number;
    scaleid: number;
    locked: boolean;
    cmid: number;
    weight: number;
    gradeformatted: string;
    grademin: number;
    grademax: number;
    rangeformatted: string;
    percentageformatted: string;
    feedback: string;
    feedbackformat: number;
}

export interface MoodleTable {
    courseid: number;
    userid: number;
    userfullname: string;
    maxdepth: number;
    tabledata: MoodleGradeItem[];
}

// --- Core ---

export interface MoodleCourse {
    id: number;
    fullname: string;
    shortname: string;
    summary: string;
    summaryformat?: number;
    progress?: number;
    enrolledusercount?: number;
    categoryname?: string;
    categoryid?: number;
    visible?: number;
    format?: string;
    startdate?: number;
    enddate?: number;
    courseimage?: string;
}

export interface MoodleCategory {
    id: number;
    name: string;
    description: string;
    descriptionformat?: number;
    parent: number;
    sortorder: number;
    coursecount: number;
    depth?: number;
    path?: string;
}

export interface MoodleUser {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    fullname: string;
    email: string;
    profileimageurl?: string;
    profileimageurlsmall?: string;
    department?: string;
    city?: string;
    country?: string;
    userissiteadmin?: boolean;
    roles?: string; // Custom mapped property
}

// --- Messaging ---

export interface MoodleMessage {
    id: number;
    useridfrom: number;
    text: string;
    timecreated: number;
    userfromfullname?: string;
}

export interface MoodleConversation {
    id: number;
    name: string;
    subname?: string;
    imageurl?: string; // Avatar URL
    type: number; // 1=Individual, 2=Group
    membercount: number;
    isstarred: boolean;
    ismuted: boolean;
    unreadcount?: number;
    members: MoodleConversationMember[];
    messages: MoodleMessage[]; // Recent messages snippet
}

export interface MoodleConversationMember {
    id: number;
    fullname: string;
    profileimageurl?: string;
    iscontact?: boolean;
    isblocked?: boolean;
    isonline?: boolean;
}

export interface MoodleNotification {
    id: number;
    useridfrom: number;
    useridto: number;
    subject: string;
    text: string; // short text
    fullmessage: string;
    fullmessagehtml: string;
    smallmessage: string;
    timecreated: number;
    read: boolean;
    contexturl?: string;
    contexturlname?: string;
    iconurl?: string;
    userfromfullname?: string;
}

export interface MoodleCalendarEvent {
    id: number;
    name: string;
    description: string;
    format: number;
    courseid: number;
    userid: number;
    modulename?: string;
    instance?: number;
    eventtype: string;
    timestart: number;
    timeduration: number;
    visible: number;
    url?: string;
    course?: {
        id: number;
        fullname: string;
        shortname: string;
    };
}
