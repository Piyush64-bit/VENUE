import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Calendar, Film, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';

const OrganizerDashboard = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['organizer-stats'],
    queryFn: organizerApi.getStats
  });

  const stats = statsData?.data || {};

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary">
      {/* Hero Section */}
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-textMuted uppercase tracking-[0.2em] font-medium mb-3">Dashboard</p>
              <h1 className="text-5xl font-light text-white tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-lg text-textMuted">Here's what's happening with your events and movies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        {/* Stats Grid - Minimal & Clean */}
        <section>
          <div className="grid grid-cols-4 gap-px bg-white/5 border border-white/5">
            {/* Revenue */}
            <div className="bg-bgPrimary p-8 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white/40" />
                </div>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Revenue</span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-light text-white tracking-tight">
                  ₹{(stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-textMuted">Total earnings</p>
              </div>
            </div>

            {/* Tickets */}
            <div className="bg-bgPrimary p-8 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Tickets</span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-light text-white tracking-tight">
                  {stats?.totalTicketsSold || 0}
                </p>
                <p className="text-xs text-textMuted">Sold to date</p>
              </div>
            </div>

            {/* Events */}
            <div className="bg-bgPrimary p-8 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white/40" />
                </div>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Events</span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-light text-white tracking-tight">
                  {stats?.totalEvents || 0}
                </p>
                <p className="text-xs text-textMuted">Active listings</p>
              </div>
            </div>

            {/* Movies */}
            <div className="bg-bgPrimary p-8 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Film className="w-5 h-5 text-white/40" />
                </div>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Movies</span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-light text-white tracking-tight">
                  {stats?.totalMovies || 0}
                </p>
                <p className="text-xs text-textMuted">Now showing</p>
              </div>
            </div>
          </div>
        </section>

        {/* Actions Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-light text-white tracking-tight">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Create Event */}
            <Link to="/organizer/events/new" className="group">
              <div className="border border-white/10 hover:border-white/20 transition-all p-10 bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Calendar className="w-6 h-6 text-white/60" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-light text-white mb-2">Create Event</h3>
                <p className="text-sm text-textMuted leading-relaxed">
                  Set up a new event with dates, venues, and ticket pricing
                </p>
              </div>
            </Link>

            {/* Create Movie */}
            <Link to="/organizer/movies/new" className="group">
              <div className="border border-white/10 hover:border-white/20 transition-all p-10 bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Film className="w-6 h-6 text-white/60" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-light text-white mb-2">Add Movie</h3>
                <p className="text-sm text-textMuted leading-relaxed">
                  Add a new movie with showtimes and seat arrangements
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Management Links */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-light text-white tracking-tight">Manage</h2>
          </div>

          <div className="space-y-px border border-white/5">
            <Link to="/organizer/events" className="group flex items-center justify-between p-6 bg-bgPrimary hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Events</p>
                  <p className="text-xs text-textMuted">View and manage all events</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/organizer/movies" className="group flex items-center justify-between p-6 bg-bgPrimary hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Film className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Movies</p>
                  <p className="text-xs text-textMuted">View and manage all movies</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
            </Link>

            <div className="group flex items-center justify-between p-6 bg-bgPrimary opacity-40 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Analytics</p>
                  <p className="text-xs text-textMuted">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
