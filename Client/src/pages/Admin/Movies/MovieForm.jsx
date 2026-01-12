import { Button, Form, Input, Select, Tabs, Upload, message, InputNumber, Row, Col } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setLoading } from '../../../redux/loadersSlice';
import { GetAllArtists } from '../../../apis/artists';
import { AddMovie, GetMovieById, UpdateMovie } from '../../../apis/movies';
import { UploadImage } from '../../../apis/images';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

const { TextArea } = Input;

function MovieForm() {
  const [artists, setArtists] = useState([]);
  const [movie, setMovie] = useState(null);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  // Load Artists for Select dropdowns
  const fetchAllArtists = async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetAllArtists();
      setArtists(
        response.data.map((artist) => ({
          value: artist._id,
          label: artist.name,
          images: artist.images,
        })),
      );
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  // Load existing movie data
  const getMovieById = useCallback(
    async (id) => {
      try {
        dispatch(setLoading(true));
        const response = await GetMovieById(id);
        const data = response.data;

        // Calculate hours and minutes from runtime (total minutes)
        const runtimeHours = data.runtime ? Math.floor(data.runtime / 60) : 0;
        const runtimeMinutes = data.runtime ? data.runtime % 60 : 0;

        // Transform data for Ant Design Form
        const formattedData = {
          ...data,
          releaseDate: data.releaseDate
            ? moment(data.releaseDate).format('YYYY-MM-DD')
            : '',
          hero: data.hero?._id,
          heroine: data.heroine?._id,
          director: data.director?._id,
          writer: data.writer?._id,
          // Cast is array of objects { artist: {_id...}, role: "..." }
          // Form list expects array of objects. We need to map `artist` object to `artist` ID for the Select
          cast: data.cast?.map((c) => ({
             artist: c.artist?._id,
             role: c.role
          })) || [],
          runtimeHours,
          runtimeMinutes,
        };

        setMovie(data);
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
      getMovieById(params.id);
    }
  }, [params.id, getMovieById]);

  // Form Submit Handler
  const onFinish = async (values) => {
    try {
      dispatch(setLoading(true));
      
      // Calculate total runtime in minutes
      const totalRuntime = (values.runtimeHours || 0) * 60 + (values.runtimeMinutes || 0);
      
      const payload = {
          ...values,
          runtime: totalRuntime,
          // cast is already in correct format { artist: ID, role: String } from Form.List
      };

      // Remove temp fields
      delete payload.runtimeHours;
      delete payload.runtimeMinutes;

      let response;
      if (params.id) {
        response = await UpdateMovie(params.id, payload);
      } else {
        response = await AddMovie(payload);
      }
      dispatch(setLoading(false));
      message.success(response.message);
      navigate('/admin/movies');
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
        const updatedPosters = [...(movie?.posters || []), uploadRes.data];
        const newMovieState = { ...movie, posters: updatedPosters };
        setMovie(newMovieState);
        setFile(null);

        if (movie?._id) {
          await UpdateMovie(movie._id, { posters: updatedPosters });
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
      const updatedPosters = movie?.posters?.filter((img) => img !== imageUrl);
      const newMovieState = { ...movie, posters: updatedPosters };
      setMovie(newMovieState);

      if (movie?._id) {
        await UpdateMovie(movie._id, { posters: updatedPosters });
        message.success('Poster removed');
      }
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className='p-5'>
      <div className='flex justify-between items-center mb-5'>
        <h1 className='text-2xl font-bold text-white'>
          {params.id ? 'Edit Movie' : 'Add New Movie'}
        </h1>
        <Button onClick={() => navigate('/admin/movies')} > Back to List </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className='admin-tabs'
        items={[
          {
            key: '1',
            label: 'Movie Details',
            children: (
              <Form layout='vertical' form={form} onFinish={onFinish} className='max-w-4xl'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Form.Item label='Movie Name' name='name' rules={[{ required: true }]}>
                    <Input placeholder='Enter movie title' />
                  </Form.Item>
                  <Form.Item label='Release Date' name='releaseDate' rules={[{ required: true }]}>
                    <Input type='date' />
                  </Form.Item>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Form.Item label='Runtime (Hours)' name='runtimeHours'>
                         <InputNumber min={0} max={10} style={{ width: '100%' }} placeholder="Hours" />
                    </Form.Item>
                    <Form.Item label='Runtime (Minutes)' name='runtimeMinutes'>
                         <InputNumber min={0} max={59} style={{ width: '100%' }} placeholder="Minutes" />
                    </Form.Item>
                     <Form.Item label='Country' name='country'>
                        <Select showSearch optionFilterProp='label' options={[
                            { value: 'India', label: 'India' },
                            { value: 'USA', label: 'USA' },
                            { value: 'UK', label: 'UK' },
                            { value: 'China', label: 'China' },
                            { value: 'Korea', label: 'Korea' },
                            { value: 'Japan', label: 'Japan' },
                            { value: 'France', label: 'France' },
                        ]} placeholder="Select Country" />
                    </Form.Item>
                </div>

                <Form.Item label='Plot Description' name='plot' rules={[{ required: true }]}>
                  <TextArea rows={3} placeholder='Enter movie plot...' />
                </Form.Item>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Form.Item label='Genre' name='genre' rules={[{ required: true }]}>
                    <Select mode="multiple"
                      options={[
                        { value: 'Action', label: 'Action' },
                        { value: 'Comedy', label: 'Comedy' },
                        { value: 'Drama', label: 'Drama' },
                        { value: 'Horror', label: 'Horror' },
                        { value: 'Romance', label: 'Romance' },
                        { value: 'Sci-Fi', label: 'Sci-Fi' },
                        { value: 'Thriller', label: 'Thriller' },
                        { value: 'Adventure', label: 'Adventure' },
                        { value: 'Fantasy', label: 'Fantasy' },
                      ]}
                      placeholder='Select Genres'
                    />
                  </Form.Item>
                  <Form.Item label='Language' name='language' rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'English', label: 'English' },
                        { value: 'Hindi', label: 'Hindi' },
                        { value: 'Telugu', label: 'Telugu' },
                        { value: 'Tamil', label: 'Tamil' },
                        { value: 'Malayalam', label: 'Malayalam' },
                        { value: 'Kannada', label: 'Kannada' },
                      ]}
                      placeholder='Select Language'
                    />
                  </Form.Item>
                  <Form.Item label='Trailer URL' name='trailer' rules={[{ required: true }]}>
                    <Input placeholder='YouTube Link' />
                  </Form.Item>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <Form.Item label='Hero (Lead)' name='hero' rules={[{ required: true }]}>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder='Lead Actor' />
                  </Form.Item>
                  <Form.Item label='Heroine (Lead)' name='heroine' rules={[{ required: true }]}>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder='Lead Actress' />
                  </Form.Item>
                  <Form.Item label='Director' name='director' rules={[{ required: true }]}>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder='Director' />
                  </Form.Item>
                   <Form.Item label='Writer' name='writer'>
                    <Select showSearch optionFilterProp='label' options={artists} placeholder='Writer' />
                  </Form.Item>
                </div>

                {/* Dynamic Cast Section */}
                 <div className="mb-6 p-4 border border-gray-700 rounded bg-gray-900 bg-opacity-30">
                     <h3 className="text-lg font-semibold mb-4 text-gray-300">Supporting Cast</h3>
                     <Form.List name="cast">
                        {(fields, { add, remove }) => (
                            <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Row key={key} gutter={16} align="middle" className="mb-3">
                                    <Col span={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'artist']}
                                            rules={[{ required: true, message: 'Select Artist' }]}
                                            className="mb-0"
                                        >
                                            <Select showSearch optionFilterProp="label" options={artists} placeholder="Select Artist (Real Name)" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'role']}
                                            rules={[{ required: true, message: 'Enter Role' }]}
                                            className="mb-0"
                                        >
                                            <Input placeholder="Character Name" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Button type="text" danger icon={<CloseOutlined />} onClick={() => remove(name)} />
                                    </Col>
                                </Row>
                            ))}
                            <Form.Item className="mb-0">
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Cast Member
                                </Button>
                            </Form.Item>
                            </>
                        )}
                    </Form.List>
                 </div>


                <div className='flex justify-end gap-3 mt-5'>
                  <Button onClick={() => navigate('/admin/movies')}>Cancel</Button>
                  <Button type='primary' htmlType='submit'>
                    {params.id ? 'Update Movie' : 'Save Movie'}
                  </Button>
                </div>
              </Form>
            ),
          },
          {
            key: '2',
            label: 'Posters',
            disabled: !movie,
            children: (
              <div className='flex flex-col gap-6'>
                <div className='flex flex-wrap gap-4'>
                  {movie?.posters?.map((image) => (
                    <div key={image} className='relative group border border-gray-700 rounded-lg overflow-hidden w-32 h-44'>
                      <img src={image} alt='poster' className='w-full h-full object-cover' />
                      <div
                        className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                        onClick={() => deletePoster(image)}
                      >
                        <span className='text-red-500 font-bold text-xl'>🗑</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='border border-dashed border-gray-600 p-6 rounded-lg bg-gray-900 bg-opacity-50'>
                   <Upload beforeUpload={(f) => { setFile(f); return false; }} onRemove={() => setFile(null)} maxCount={1} listType='picture'>
                      <Button type='dashed' className='text-white border-gray-500'> Select Poster Image </Button>
                   </Upload>
                   <Button type='primary' onClick={handleImageUpload} disabled={!file} className='mt-4'>
                      Upload Selected Poster
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

export default MovieForm;
