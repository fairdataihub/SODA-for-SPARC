import React from 'react'
import './App.css';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Home from './pages/Homepage';
import Download from './pages/Download';
import UserInterface from './pages/UserInterface';
import Documentation from './pages/Documentation';
import Organize from './pages/Organize';
import BetaTesting from './pages/Betatesting';
import Privacy from './pages/Privacy';
import BlackfynnAcc from './pages/BlackfynnAcc';
import HandleDatasets from './pages/HandleDatasets';
import Metadata from './pages/metadata';
import ManagePermissions from './pages/ManagePermissions';
import UploadLocal from './pages/UploadLocal';
import DatasetStatus from './pages/DatasetStatus';
import ConnectAirtable from './pages/ConnectAirtable';
import AwardInfo from './pages/AwardInfo';
import SubmissionFile from './pages/SubmissionFile';
import DescriptionFile from './pages/DescriptionFile';
import DownloadTemplates from './pages/DownloadTemplates';
import OrganizeDatasets from './pages/OrganizeDatasets';
import CurationTeam from './pages/CurationTeam';
import SparcConsortium from './pages/SparcConsortium';
import Submit from './pages/Submit';
import SourceCode from './pages/UsingCode';
import Packaging from './pages/Packaging';
import SubmissionMetadata from './pages/SubmissionMetadata';
import ManifestMetadata from './pages/ManifestMetadata';
import DescriptionMetadata from './pages/DescriptionMetadata';

function App() {
  return (
    <Router>
		<Switch>
			<Route path='/' component={Home} exact />
			<Route path='/documentation' component={Documentation} exact />
			<Route path='/documentation/getting-started/download-and-open-soda' component={Download} exact />
			<Route path='/documentation/getting-started/user-interface' component={UserInterface} exact />
			<Route path='/documentation/getting-started/organize-and-submit-datasets' component={Organize} exact />
			<Route path='/documentation/getting-started/beta-testing' component={BetaTesting} exact />
			<Route path='/documentation/getting-started/privacy-policy' component={Privacy} exact />
			<Route path='/documentation/manage-datasets/connect-to-account' component={BlackfynnAcc} exact />
			<Route path='/documentation/manage-datasets/handle-datasets' component={HandleDatasets} exact />
			<Route path='/documentation/manage-datasets/add-metadata' component={Metadata} exact />
			<Route path='/documentation/manage-datasets/manage-permissions' component={ManagePermissions} exact />
			<Route path='/documentation/manage-datasets/upload-dataset' component={UploadLocal} exact />
			<Route path='/documentation/manage-datasets/view-and-change-status' component={DatasetStatus} exact />
			<Route path='/documentation/prepare-metadata/connect-to-airtable' component={ConnectAirtable} exact />
			<Route path='/documentation/prepare-metadata/provide-award-info' component={AwardInfo} exact />
			<Route path='/documentation/prepare-metadata/prepare-submission-file' component={SubmissionFile} exact />
			<Route path='/documentation/prepare-metadata/prepare-description-file' component={DescriptionFile} exact />
			<Route path='/documentation/prepare-metadata/download-templates' component={DownloadTemplates} exact />
			<Route path='/documentation/prepare-dataset/organize-dataset' component={OrganizeDatasets} exact />
			<Route path='/documentation/disseminate-dataset/share-with-curation-team' component={CurationTeam} exact />
			<Route path='/documentation/disseminate-dataset/share-with-sparc-consortium' component={SparcConsortium} exact />
			<Route path='/documentation/disseminate-dataset/submit-for-review' component={Submit} exact />
			<Route path='/documentation/disseminate-dataset/using-source-code' component={SourceCode} exact />
			<Route path='/documentation/disseminate-dataset/packaging' component={Packaging} exact />
			<Route path='/documentation/how-to-sparc-series/structure-submission-metadata-file' component={SubmissionMetadata} exact />
			<Route path='/documentation/how-to-sparc-series/structure-dataset-description-metadata-file' component={DescriptionMetadata} exact />
			<Route path='/documentation/how-to-sparc-series/structure-manifest-metadata-file' component={ManifestMetadata} exact />
		</Switch> 
	</Router>
  );
}

export default App;