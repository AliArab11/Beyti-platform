using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Service")]
[Index("ServiceProviderId", Name = "IX_Service_Provider")]
[Index("ServiceCatalogId", Name = "IX_Service_Catalog")]
public partial class Service
{
    [Key]
    public int Id { get; set; }

    public int ServiceProviderId { get; set; }

    public int ServiceCatalogId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = null!;

    [StringLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MinPrice { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MaxPrice { get; set; }

    public int? EstimatedDuration { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("ServiceProviderId")]
    [InverseProperty("Services")]
    public virtual ServiceProvider ServiceProvider { get; set; } = null!;

    [ForeignKey("ServiceCatalogId")]
    [InverseProperty("Services")]
    public virtual ServiceCatalog ServiceCatalog { get; set; } = null!;

    [InverseProperty("Service")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();
}
