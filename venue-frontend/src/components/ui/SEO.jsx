import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords }) => {
  return (
    <Helmet>
      <title>VENUE</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={title || 'VENUE'} />
      <meta property="og:description" content={description} />
      <meta property="twitter:card" content="summary_large_image" />
    </Helmet>
  );
};

export default SEO;
