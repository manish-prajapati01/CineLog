export default function CatalogueNotice({data}) {
 if(!data)return null;
 return <p className='cl-source-note' role='status'>{data.stale?'The catalogue is temporarily unavailable. Showing previously saved information; dates may have changed.':`Some details are unavailable. Showing matched information from ${data.provider}.`}{data.url&&<> <a href={data.url} target='_blank' rel='noopener noreferrer'>Source</a>{data.license&&` · ${data.license}`}</>}</p>;
}
