import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/dataset-info.gif'
import image2 from '../images/contributor-info-1.gif'
import image3 from '../images/link-info.gif'
import image4 from '../images/completeness-info.gif'
import image5 from '../images/contributor-info-2.gif'

export const Image = styled.img`
    width: 100%;
    
`;

export const ImgWrap =  styled.div`
    max-width: 700px;
    margin-top: 25px;
`;

export const List = styled.ul`
    margin-top: 25px;
    padding-left: 5.6%;
    width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

export const H = styled.div`
    font-size: 24px;
    font-weight: 500;
    width: 100%;
    margin-top: 25px;
`;

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;


const DescriptionFile = () => {
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
                <ArticleTitle>Prepare your Dataset Description File</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>Under this feature, SODA lets you quickly and accurately prepare the dataset_description metadata file which is mandatory for all SPARC datasets. SODA provides a convenient interface, which is more intuitive than the Excel spreadsheet template. It also makes use of information from your dataset on Blackfynn and the SPARC Airtable sheet to help you populate some of the fields easily. The expected structure of this file, generated automatically by SODA, is explained in our corresponding <Link>"How to" page</Link> if you would like to learn about it.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <ArticleP>The interface divides the dataset decription in four convenient sections to facilitate your task. Go through them successively and populate the various fields as indicated:</ArticleP>
                <List>
                    <ListItem>Dataset Info (high-level information about your dataset):
                        <List>
                            <ListItem>Name: Descriptive title for the dataset. Since this field should match exactly with your dataset on Blackfynn, SODA let you select it from your list of Blackfynn datasets (see <Link>"Connect to your Blackfynn account"</Link> section).</ListItem>
                            <ListItem>Description: Brief description of the study and the dataset. This is populated automatically from your dataset description on Blackfynn for your convenience (see <Link>"Add metadata to dataset"</Link> feature for adding a description).</ListItem>
                            <ListItem>Keywords: A set of 3-5 keywords (other than those used in the name and description) that will help in searching your dataset once published.</ListItem>
                            <ListItem>Number of subjects: Number of unique subjects in this dataset, should match subjects metadata file. Must be greater or equal to 1.</ListItem>
                            <ListItem>Number of samples: Number of unique samples in this dataset, should match samples metadata file. Set to zero if there are no samples.</ListItem>
                        </List>
                    </ListItem>
                    <ImgWrap><Image src={image1} /></ImgWrap>
                    <ListItem>Contributor Info (information about the contributors to your dataset):
                        <List>
                            <ListItem>SPARC Award: Select the SPARC award associated with your dataset.</ListItem>
                            <ListItem>Other funding sources: Specify other funding sources, if any. Hit 'Enter' on your keyboard after typing each. Leave empty if none.</ListItem>
                            <ListItem>Acknowledgments: Specify any acknowledgments beyond funding and contributors. Leave empty if none.</ListItem>
                            <ListItem>Contributor Information:
                                <List>
                                <ListItem>Provide information about any contributor to the dataset. Note that the "Contributor" list is compiled from the SPARC Airtable sheet based on the SPARC award selected. Select one Contributor to get the ORCID ID, Contributor Affiliation, and Contributor Role populated automatically (if specified in the SPARC Airtable Sheet). Select "Other contributors" in the "Contributors" dropdown list if you'd like to enter a Contributor name manually (although we suggest to enter them directly in the SPARC Airtable - restart SODA to see them in the list).</ListItem>
                                <ListItem>Check "Is Contact person?" if the contributor is a contact person for the dataset. At least one and only one of the contributors should be the contact person.</ListItem>
                                <ListItem>Click "Add" to add the contributor to SODA's contributor table. Each contributor added to the table will be added to the dataset description file when it is generated.</ListItem>
                                </List>
                            </ListItem>
                        </List>
                    </ListItem>
                    <ImgWrap><Image src={image2} /></ImgWrap>
                    <ListItem>Article(s) and protocol(s) (information about article(s) and protocol(s) related to this dataset):
                        <List>
                            <ListItem>Link type: Select the nature of the link among:
                                <List>
                                <ListItem>Protocol URL or DOI: URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.</ListItem>
                                <ListItem>Originating Article DOI: DOIs of published articles that were generated from this dataset.</ListItem>
                                <ListItem>Additional links: URLs of additional resources used by this dataset (e.g., a link to a code repository).</ListItem>
                                </List>
                            </ListItem>
                            <ListItem>Link: Enter the link.</ListItem>
                            <ListItem>Link description: Optionally provide a short description of the link.</ListItem>
                            <ListItem>Click on "Add" to register specified link to SODA's link table. All links and descriptions added to the table will be included in your dataset description file when it is generated.</ListItem>
                        </List>
                    </ListItem>
                    <ImgWrap><Image src={image3} /></ImgWrap>
                    <ListItem>Completeness Info (information about potential relation with other dataset(s)):
                        <List>
                        <ListItem>Completeness of dataset: Is the data set as uploaded complete or is it part of an ongoing study? Select "hasNext" to indicate that you expect more data on different subjects as a continuation of this study. Select “hasChildren” to indicate that you expect more data on the same subjects or samples derived from those subjects. Leave empty if none.</ListItem>
                        <ListItem>Parent dataset(s): If this is a part of a larger dataset, or references subjects or samples from a parent dataset, select the prior dataset. You need only the last dataset, not all datasets. If samples and subjects are from multiple parent datasets please select them all. Leave empty if none.</ListItem>
                        <ListItem>Title for complete dataset: Give a provisional title for the entire dataset. Leave empty if not applicable.</ListItem>
                        </List>
                    </ListItem>
                    <ImgWrap><Image src={image4} /></ImgWrap>
                    <ListItem>After you complete all steps, click on "Generate" to generate your dataset description file. A warning message may show up if any mandatory fields are missing. You may decide to go back and address the issues or generate the file anyway (and address the issues later).</ListItem>
                </List>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <ArticleP>In the contributors table, you can drag and drop rows to organize contributors in the order that they should appear in the dataset_description file. You can also remove one with the delete button.</ArticleP>
                <ImgWrap><Image src={image5} /></ImgWrap>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='background' smooth='true'>Background</ScrollSubTitle>
                <ScrollSubTitle to='how-to' smooth='true'>How To</ScrollSubTitle>
                <ScrollSubTitle to='notes' smooth='true'>Notes</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default DescriptionFile
