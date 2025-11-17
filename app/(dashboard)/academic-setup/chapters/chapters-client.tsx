"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { deleteChapter } from "@/lib/actions/chapter.actions";
import ChapterForm from "./chapter-form";

type Subject = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Class = {
  id: string;
  name: string;
  alias: string | null;
};

type Chapter = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  order: number;
  status: "ACTIVE" | "INACTIVE";
  subject: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  class: {
    id: string;
    name: string;
    alias: string | null;
  };
  _count: {
    topics: number;
  };
};

type Props = {
  initialChapters: Chapter[];
  subjects: Subject[];
  classes: Class[];
};

export default function ChaptersClient({
  initialChapters,
  subjects,
  classes,
}: Props) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);

  // Filter chapters
  const filteredChapters = chapters.filter((chapter) => {
    const matchesSearch =
      searchQuery === "" ||
      chapter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      filterSubject === "" || chapter.subject.id === filterSubject;
    const matchesClass = filterClass === "" || chapter.class.id === filterClass;
    const matchesStatus =
      filterStatus === "" || chapter.status === filterStatus;

    return matchesSearch && matchesSubject && matchesClass && matchesStatus;
  });

  // Handle delete
  const confirmDelete = async () => {
    if (!deletingChapter) return;

    const result = await deleteChapter(deletingChapter.id);

    if (result.success) {
      setChapters((prev) => prev.filter((c) => c.id !== deletingChapter.id));
      toast.success("Chapter deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete chapter");
    }

    setDeleteDialogOpen(false);
    setDeletingChapter(null);
  };

  // Handle form success
  const handleFormSuccess = (chapter: Chapter) => {
    if (editingChapter) {
      // Update existing
      setChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? chapter : c))
      );
      toast.success("Chapter updated successfully");
    } else {
      // Add new
      setChapters((prev) => [...prev, chapter]);
      toast.success("Chapter created successfully");
    }
    setAddDialogOpen(false);
    setEditingChapter(null);
  };

  // Get status badge
  const getStatusBadge = (status: "ACTIVE" | "INACTIVE") => {
    if (status === "ACTIVE") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          ✅ Active
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        ⏸️ Inactive
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
          <div>
            <SearchableDropdown
              options={[
                { value: "", label: "All Subjects" },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: `${subject.icon || "📚"} ${subject.name}`,
                })),
              ]}
              value={filterSubject}
              onChange={setFilterSubject}
              placeholder="All Subjects"
              className="h-9"
            />
          </div>
          <div>
            <SearchableDropdown
              options={[
                { value: "", label: "All Classes" },
                ...classes.map((cls) => ({
                  value: cls.id,
                  label: `${cls.name}${cls.alias ? ` (${cls.alias})` : ""}`,
                })),
              ]}
              value={filterClass}
              onChange={setFilterClass}
              placeholder="All Classes"
              className="h-9"
            />
          </div>
          <div>
            <SearchableDropdown
              options={[
                { value: "", label: "All Status" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="All Status"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
        <div className="p-4 border-b border-border dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground dark:text-slate-200">
            All Chapters ({filteredChapters.length})
          </h2>
          <Button
            onClick={() => {
              setEditingChapter(null);
              setAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted/50 dark:bg-slate-800/50">
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent border-border dark:border-slate-700">
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Order
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Chapter
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Subject
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Class
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Code
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200">
                Topics
              </TableHead>
              <TableHead className="font-semibold text-foreground dark:text-slate-200 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChapters.length === 0 ? (
              <TableRow className="border-b border-border dark:border-slate-700">
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground dark:text-slate-400"
                >
                  No chapters found
                </TableCell>
              </TableRow>
            ) : (
              filteredChapters.map((chapter) => (
                <TableRow
                  key={chapter.id}
                  className="border-border dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-800/50"
                >
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {chapter.order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl bg-slate-100 dark:bg-slate-700 w-10 h-10 rounded-lg flex items-center justify-center">
                        📖
                      </div>
                      <p className="font-medium text-foreground dark:text-slate-200">
                        {chapter.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground dark:text-slate-300">
                      {chapter.subject.icon || "📚"} {chapter.subject.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground dark:text-slate-300">
                      {chapter.class.name}
                      {chapter.class.alias && (
                        <span className="text-xs text-muted-foreground dark:text-slate-400 ml-1">
                          ({chapter.class.alias})
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground dark:text-slate-400">
                      {chapter.code || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(chapter.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground dark:text-slate-300">
                      {chapter._count.topics}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingChapter(chapter);
                          setAddDialogOpen(true);
                        }}
                        className="dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingChapter(chapter);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              {editingChapter ? "Edit Chapter" : "Add Chapter"}
            </DialogTitle>
          </DialogHeader>
          <ChapterForm
            chapter={editingChapter}
            subjects={subjects}
            classes={classes}
            chapters={chapters}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setAddDialogOpen(false);
              setEditingChapter(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">
              Delete Chapter
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete &quot;{deletingChapter?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
