import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, ArticleP, Section,Scroll, ScrollTitle, ScrollSubTitle, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

export const List = styled.ul`
    padding-left: 5.6%;
    max-width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

const Privacy = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };
    return (
        <div>
            <SidebarRes isOpen={isOpen} toggle={toggle} />
            <Sidebar toggle={toggle}/>
            <Page
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}> 
            <Article>
                <ArticleTitle>Privacy Policy</ArticleTitle>
                <ArticleP>In this privacy notice, we seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it. If you have any questions or concerns about this privacy notice or our practices with regards to your personal information, please contact us at <Link>bPatel@calmi2.org</Link>.</ArticleP>
                <ArticleP>Last revised date: 12/11/2020</ArticleP>
                <Section className='one'>
                <ArticleSubTitle>Why do we collect information?</ArticleSubTitle>
                <ArticleP>Tracking is implemented as part of our agreement with the SPARC program to report usage statistics for SODA. Tracking is also used to spot errors and subsequently improve user experience.</ArticleP>
                </Section>

                <Section className='two'>
                <ArticleSubTitle>What information do we collect?</ArticleSubTitle>
                <ArticleP>We automatically collect certain information when you launch, use, or navigate SODA (the App). This information is collected anonymously and does not reveal your specific identity (like your name or contact information) but may include device and usage information, operating system, information about how you use our App, and other technical information.</ArticleP>
                <ArticleP>For a detailed list regarding what information is tracked within the App please refer to <Link>What do we track?</Link>.</ArticleP>
                <ArticleP>We employ the use of Google Analytics to track and log user events within the App. To learn more, please visit their <Link>Terms of service</Link>.</ArticleP>
                </Section>

                <Section className='three'>
                <ArticleSubTitle>How do we use the collected information?</ArticleSubTitle>
                <ArticleP>This information is to generate usage analytics (number of users, features being used, etc.) for our reporting purposes.</ArticleP>
                </Section>

                <Section className='four'>
                <ArticleSubTitle>Will the collected information be shared with anyone?</ArticleSubTitle>
                <ArticleP>Collected information will be shared with the SPARC management team. It may also be shared with other SPARC funded groups as well as displayed on our publicly accessible GitHub page.</ArticleP>
                </Section>

                <Section className='five'>
                <ArticleSubTitle>How do we use cookies and other tracking technologies?</ArticleSubTitle>
                <ArticleP>We use Google's Universal Analytics program to track anonymized user interactions within the App. To learn more about the technologies used please refer to <Link>Security and privacy in Universal Analytics</Link>.</ArticleP>
                </Section>

                <Section className='six'>
                <ArticleSubTitle>How long do we keep the collected information?</ArticleSubTitle>
                <ArticleP>We will only keep collected usage data for as long as it is necessary for the purposes set out in this privacy notice unless a longer retention period is required or permitted by law.</ArticleP>
                </Section>

                <Section className='seven'>
                <ArticleSubTitle>How do we keep the collected data safe?</ArticleSubTitle>
                <ArticleP>Collected information is completely anonymized. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security, and improperly collect, access, steal, or modify your information. Although we will do our best to protect your information, the transmission of personal information to and from our App is always a possible risk. You should only access the App within a secure environment.</ArticleP>
                </Section>

                <Section className='eight'>
                <ArticleSubTitle>What are your privacy rights?</ArticleSubTitle>
                <ArticleP>If you are a resident in the European Economic Area and you believe we are unlawfully processing your personal information, you also have the right to complain to your local data protection supervisory authority. You can find their contact details here: <Link>http://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm</Link>.</ArticleP>
                <ArticleP>If you are a resident in Switzerland, the contact details for the data protection authorities are available here: <Link>https://www.edoeb.admin.ch/edoeb/en/home.html</Link>.</ArticleP>
                </Section>

                <Section className='nine'>
                <ArticleSubTitle>Controls for do-not-track features</ArticleSubTitle>
                <ArticleP>Most operating systems include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this privacy notice.</ArticleP>
                </Section>

                <Section className='ten'>
                <ArticleSubTitle>Do California residents have specific privacy rights?</ArticleSubTitle>
                <ArticleP>In Short: Yes, if you are a resident of California, you are granted specific rights regarding access to your personal information.</ArticleP>
                <ArticleP>California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us using the contact information provided below.</ArticleP>
                <ArticleP>If you are under 18 years of age, reside in California, and have a registered account with the App, you have the right to request the removal of unwanted data. To request removal of such data, please contact us using the contact information provided below, and include a statement that you reside in California. We will make sure the data is not tracked on the App, but please be aware that the data may not be completely or comprehensively removed from all our systems (e.g. backups, etc.).</ArticleP>
                </Section>

                <Section className='eleven'>
                <ArticleSubTitle>Do we make updates to this notice?</ArticleSubTitle>
                <ArticleP>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</ArticleP>
                </Section>

                <Section className='twelve'>
                <ArticleSubTitle>How can you review, update, or delete the data we collect from you?</ArticleSubTitle>
                <ArticleP>Based on the applicable laws of your country, you may have the right to request access to the information we collect from you, change that information, or delete it in some circumstances. To request to review, update, or delete your personal information, please submit a request to <Link>bPatel@calmi2.org</Link>. Alternatively, you can also use <Link>our feedback form</Link>. We will respond to your request within 30 days.</ArticleP>
                </Section>

                <Section className='thirteen'>
                <ArticleSubTitle>What do we track?</ArticleSubTitle>
                <ArticleP>All the information that is tracked within SODA is anonymized with privacy in mind. We do not track any passwords, personal details, or other identifying information. The following items are tracked within SODA:</ArticleP>
                <List style={{marginTop: 25 + 'px'}}>

                <ListItem>When SODA is opened:
                    <List>
                        <ListItem>Operating system version</ListItem>
                        <ListItem>App version</ListItem>
                        <ListItem>Success/Errors when connecting to the back-end system</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you connect to your Blackfynn account:
                    <List>
                        <ListItem>Success/Errors with the connection</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you create an empty dataset:
                    <List>
                        <ListItem>Success/Errors with the creation</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you rename an existing dataset:
                    <List>
                        <ListItem>Success/Errors with the renaming</ListItem>
                        <ListItem>The old and new names of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you upload a local dataset:
                    <List>
                        <ListItem>Success/Errors with the upload</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                        <ListItem>The size of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you add/edit a dataset's subtitle:
                    <List>
                        <ListItem>Success/Errors with the change in the subtitle</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you add/edit a dataset's description:
                    <List>
                        <ListItem>Success/Errors with the change in the description</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you upload a banner image for the dataset:
                    <List>
                        <ListItem>Success/Errors with the upload</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you assign a license to the dataset:
                    <List>
                        <ListItem>Success/Errors with the assignment</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                    </List>
                </ListItem>
                <ListItem>When you share a dataset with the Curation Team:
                    <List>
                        <ListItem>Success/Errors with the submission</ListItem>
                        <ListItem>The name of the dataset</ListItem>
                    </List>
                </ListItem>
                
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='one' smooth='true'>What information do we collect?</ScrollSubTitle>
                <ScrollSubTitle to='two' smooth='true'>What information do we collect?</ScrollSubTitle>
                <ScrollSubTitle to='three' smooth='true'>How do we use the collected information?</ScrollSubTitle>
                <ScrollSubTitle to='four' smooth='true'>Will the collected information be shared with anyone?</ScrollSubTitle>
                <ScrollSubTitle to='five' smooth='true'>How do we use cookies and other tracking technologies?</ScrollSubTitle>
                <ScrollSubTitle to='six' smooth='true'>How long do we keep the collected information?</ScrollSubTitle>
                <ScrollSubTitle to='seven' smooth='true'>How do we keep the collected data safe?</ScrollSubTitle>
                <ScrollSubTitle to='eight' smooth='true'>What are your privacy rights?</ScrollSubTitle>
                <ScrollSubTitle to='nine' smooth='true'>Controls for do-not-track features</ScrollSubTitle>
                <ScrollSubTitle to='ten' smooth='true'>Do California residents have specific privacy rights?</ScrollSubTitle>
                <ScrollSubTitle to='eleven' smooth='true'>Do we make updates to this notice?</ScrollSubTitle>
                <ScrollSubTitle to='twelve' smooth='true'>How can you review, update, or delete the data we collect from you?</ScrollSubTitle>
                <ScrollSubTitle to='thirteen' smooth='true'>What do we track?</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default Privacy