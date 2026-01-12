import { Button, Form, Input, Select, Tabs, Upload, message, InputNumber } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setLoading } from '../../../redux/loadersSlice';
import { GetAllArtists } from '../../../apis/artists';
import { AddSeries, GetSeriesById, UpdateSeries } from '../../../apis/series';
import { UploadImage } from '../../../apis/images';
import moment from 'moment';

const { TextArea } = Input;

function SeriesForm() {
  const [artists, setArtists] = useState([]);
  const [series, setSeries] = useState(null);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState('1');

  const fetchAllArtists = async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetAllArtists();
      setArtists(
        response.data.map((artist) => ({
          value: artist._id,
          label: artist.name,
        })),
      );
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  const getSeriesById = useCallback(
    async (id) => {
      try {
        dispatch(setLoading(true));
        const response = await GetSeriesById(id);
        const data = response.data;

        const formattedData = {
          ...data,
          releaseDate: data.releaseDate
            ? moment(data.releaseDate).format('YYYY-MM-DD')
            : '',
          hero: data.hero?._id,
          heroine: data.heroine?._id,
          director: data.director?._id,
          cast: data.cast?.map((c) => c._id) || [],
        };

        setSeries(data);
        form.setFieldsValue(formattedData);
        dispatch(setLoading(false));
      } catch (error) {
        dispatch(setLoading(false));
        message.error(error.message);
      }
    },
    [dispatch, form],
  );

  useEffect(() => {
    fetchAllArtists();
    if (params.id) {
      getSeriesById(params.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, getSeriesById]);

  const onFinish = async (values) => {
    try {
      dispatch(setLoading(true));
      let response;
      if (params.id) {
        response = await UpdateSeries(params.id, values);
      } else {
        response = await AddSeries(values);
      }
      dispatch(setLoading(false));
      message.success(response.message);
      navigate('/admin/series');
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  };

  const handleImageUpload = async () => {
    if (!file) return message.error('Please select a file first');
    try {
      const formData = new FormData();
      formData.append('image', file);
      dispatch(setLoading(true));

      const uploadRes = await UploadImage(formData);
      if (uploadRes.success) {
        const updatedPosters = [...(series?.posters || []), uploadRes.data];
        const newSeriesState = { ...series, posters: updatedPosters };
        setSeries(newSeriesState);
        setFile(null);

        if (series?._id) {
          await UpdateSeries(series._id, { posters: updatedPosters });
          message.success('Poster added');
        }
      }
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message || 'Upload failed');
      dispatch(setLoading(false));
    }
  };

  const deletePoster = async (imageUrl) => {
    try {
      dispatch(setLoading(true));
      const updatedPosters = series?.posters?.filter((img) => img !== imageUrl);
      const newSeriesState = { ...series, posters: updatedPosters };
      setSeries(newSeriesState);

      if (series?._id) {
        await UpdateSeries(series._id, { posters: updatedPosters });
        message.success('Poster removed');
      }
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  return (
    <div style={{ background: '#1f1f1f', padding: '30px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#f5c518' }}>
          {params.id ? 'Edit TV Show' : 'Add New TV Show'}
        </h1>
        <Button onClick={() => navigate('/admin/series')}>Back to List</Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: 'Series Details',
            children: (
              <Form layout='vertical' form={form} onFinish={onFinish} style={{ maxWidth: 800 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <Form.Item label='Series Title' name='name' rules={[{ required: true }]}>
                    <Input placeholder='Enter series title' />
                  </Form.Item>
                  <Form.Item label='First Air Date' name='releaseDate' rules={[{ required: true }]}>
                    <Input type='date' />
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <Form.Item label='Total Seasons' name='totalSeasons'>
                      <InputNumber min={1} style={{ width: '100%' }} />
                   </Form.Item>
                   <Form.Item label='Status' name='status'>
                      <Select options={[
                          { value: 'Ongoing', label: 'Ongoing' },
                          { value: 'Ended', label: 'Ended' },
                          { value: 'Canceled', label: 'Canceled' },
                      ]} />
                   </Form.Item>
                </div>

                <Form.Item label='Plot Description' name='plot' rules={[{ required: true }]}>
                  <TextArea rows={4} placeholder='Enter plot summary...' />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <Form.Item label='Genre' name='genre' rules={[{ required: true }]}>
                    <Select options={[
                        { value: 'Action', label: 'Action' },
                        { value: 'Comedy', label: 'Comedy' },
                        { value: 'Drama', label: 'Drama' },
                        { value: 'Horror', label: 'Horror' },
                        { value: 'Sci-Fi', label: 'Sci-Fi' },
                        { value: 'Thriller', label: 'Thriller' },
                      ]} 
                     placeholder="Genre"
                    />
                  </Form.Item>
                  <Form.Item label='Language' name='language' rules={[{ required: true }]}>
                    <Select options={[
                        { value: 'English', label: 'English' },
                        { value: 'Hindi', label: 'Hindi' },
                    ]} placeholder="Language" />
                  </Form.Item>
                  <Form.Item label='Trailer URL' name='trailer' rules={[{ required: true }]}>
                    <Input placeholder='YouTube Link' />
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <Form.Item label='Lead Actor' name='hero'>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder="Actor" />
                  </Form.Item>
                  <Form.Item label='Lead Actress' name='heroine'>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder="Actress" />
                  </Form.Item>
                  <Form.Item label='Director/Creator' name='director'>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder="Director" />
                  </Form.Item>
                </div>
                
                <Form.Item label='Cast & Crew (Supporting)' name='cast'>
                    <Select mode='multiple' showSearch optionFilterProp='label' options={artists} />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <Button onClick={() => navigate('/admin/series')}>Cancel</Button>
                  <Button type='primary' htmlType='submit'>
                    {params.id ? 'Update Series' : 'Save Series'}
                  </Button>
                </div>
              </Form>
            ),
          },
          {
            key: '2',
            label: 'Posters',
            disabled: !series,
            children: (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                  {series?.posters?.map((image) => (
                    <div key={image} style={{ position: 'relative', width: '120px', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #444' }}>
                      <img src={image} alt='poster' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div 
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                        className="poster-hover"
                        onClick={() => deletePoster(image)}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                         <span style={{ fontSize: '1.5rem' }}>🗑</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ border: '2px dashed #444', padding: '20px', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                   <Upload beforeUpload={(f) => { setFile(f); return false; }} onRemove={() => setFile(null)} maxCount={1} listType='picture'>
                      <Button style={{ background: 'transparent', color: '#fff' }}>Select Poster</Button>
                   </Upload>
                   <Button type='primary' onClick={handleImageUpload} disabled={!file} style={{ marginTop: '15px' }}>
                      Upload Poster
                   </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export default SeriesForm;
